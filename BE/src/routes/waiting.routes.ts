import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { emitEquipmentUpdate, emitEquipmentListUpdate, emitUserNotification } from '../socket/socket.server'
import type { AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// 활성 타임아웃 관리
const activeTimeouts = new Map<string, NodeJS.Timeout>()

function scheduleTimeout(key: string, ms: number, callback: () => void) {
  const existing = activeTimeouts.get(key)
  if (existing) clearTimeout(existing)
  activeTimeouts.set(key, setTimeout(callback, ms))
}

function clearActiveTimeout(key: string) {
  const existing = activeTimeouts.get(key)
  if (existing) {
    clearTimeout(existing)
    activeTimeouts.delete(key)
  }
}

// 다음 대기자에게 내 차례 알림 + 5분 타임아웃 설정
async function notifyNextUser(equipmentId: number) {
  const next = await prisma.waitingQueue.findFirst({
    where: { equipmentId, status: 'WAITING' },
    orderBy: { queuePosition: 'asc' },
    include: { equipment: true },
  })
  if (!next) return

  await prisma.waitingQueue.update({
    where: { id: next.id },
    data: { notifiedAt: new Date() },
  })

  emitUserNotification(next.userId, {
    type: 'YOUR_TURN',
    waitingId: next.id,
    equipmentName: next.equipment.name,
  })

  prisma.notification.create({
    data: {
      userId: next.userId,
      type: 'YOUR_TURN',
      category: 'WAITING',
      title: '내 차례예요!',
      message: `예약한 ${next.equipment.name}에 자리가 비었어요!`,
      equipmentId: next.equipment.id,
      equipmentName: next.equipment.name,
      queueId: next.id,
    },
  }).catch(err => console.error('[notification] YOUR_TURN 저장 실패:', err))

  // 5분 내 미응답 시 자동 취소 후 다음 사람에게 넘김
  scheduleTimeout(`turn:${next.id}`, 5 * 60 * 1000, async () => {
    try {
      const w = await prisma.waitingQueue.findUnique({ where: { id: next.id } })
      if (!w || w.status !== 'WAITING') return

      await prisma.$transaction([
        prisma.waitingQueue.update({ where: { id: next.id }, data: { status: 'CANCELLED' } }),
        prisma.waitingQueue.updateMany({
          where: { equipmentId, status: 'WAITING', queuePosition: { gt: w.queuePosition } },
          data: { queuePosition: { decrement: 1 } },
        }),
      ])

      const waitingCount = await prisma.waitingQueue.count({ where: { equipmentId, status: 'WAITING' } })
      emitEquipmentUpdate(equipmentId, { equipmentId, waitingCount })
      emitEquipmentListUpdate()
      await notifyNextUser(equipmentId)
    } catch (err) {
      console.error('[timeout] turn timeout error:', err)
    }
  })
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  const kstDates = [...new Set(dates.map(d => {
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    return kst.toISOString().split('T')[0]
  }))].sort().reverse()
  const now = new Date()
  const todayKST = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
  const yesterdayKST = new Date(now.getTime() + 9 * 60 * 60 * 1000 - 86400000).toISOString().split('T')[0]
  if (kstDates[0] !== todayKST && kstDates[0] !== yesterdayKST) return 0
  let streak = 1
  for (let i = 1; i < kstDates.length; i++) {
    const diff = (new Date(kstDates[i - 1]).getTime() - new Date(kstDates[i]).getTime()) / 86400000
    if (Math.round(diff) === 1) streak++
    else break
  }
  return streak
}

async function updateMissionProgress(userId: number): Promise<{ id: number; name: string; rewardPoints: number }[]> {
  const missions = await prisma.mission.findMany({ where: { isActive: true } })
  const completedQueues = await prisma.waitingQueue.findMany({
    where: { userId, status: 'COMPLETED' },
    select: { sets: true, equipmentId: true, updatedAt: true },
  })

  const totalSets = completedQueues.reduce((sum, q) => sum + q.sets, 0)
  const distinctEquipments = new Set(completedQueues.map(q => q.equipmentId)).size
  const streakDays = calculateStreak(completedQueues.map(q => q.updatedAt))

  const newlyCompleted: { id: number; name: string; rewardPoints: number }[] = []

  for (const mission of missions) {
    let progress = 0
    if (mission.condition === 'TOTAL_SETS') progress = totalSets
    else if (mission.condition === 'TOTAL_EQUIPMENTS') progress = distinctEquipments
    else if (mission.condition === 'STREAK_DAYS') progress = streakDays

    const existing = await prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId: mission.id } },
    })
    if (existing?.isCompleted) continue

    const isNowCompleted = progress >= mission.conditionValue
    await prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId: mission.id } },
      update: { progress, isCompleted: isNowCompleted, ...(isNowCompleted && { completedAt: new Date() }) },
      create: { userId, missionId: mission.id, progress, isCompleted: isNowCompleted, ...(isNowCompleted && { completedAt: new Date() }) },
    })

    if (isNowCompleted) {
      await prisma.user.update({ where: { id: userId }, data: { points: { increment: mission.rewardPoints } } })
      newlyCompleted.push({ id: mission.id, name: mission.name, rewardPoints: mission.rewardPoints })
    }
  }

  return newlyCompleted
}

// 운동 완료 처리 (USING → COMPLETED) + 다음 대기자 알림
async function completeWaiting(id: number, equipmentId: number, actualWorkMs?: number, actualRestMs?: number) {
  clearActiveTimeout(`using:${id}`)

  const { userId } = await prisma.waitingQueue.update({
    where: { id },
    data: { status: 'COMPLETED', ...(actualWorkMs != null && { actualWorkMs }), ...(actualRestMs != null && { actualRestMs }) },
    select: { userId: true },
  })

  const waitingCount = await prisma.waitingQueue.count({ where: { equipmentId, status: 'WAITING' } })
  emitEquipmentUpdate(equipmentId, { equipmentId, waitingCount })
  emitEquipmentListUpdate()
  await notifyNextUser(equipmentId)
  return updateMissionProgress(userId)
}

// POST /api/waiting — 대기 등록
router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { equipmentId, sets, restSeconds } = req.body as {
      equipmentId: number
      sets: number
      restSeconds: number
    }

    if (!equipmentId || !sets) {
      res.status(400).json({ message: '필수 항목이 누락되었습니다.' })
      return
    }

    const existing = await prisma.waitingQueue.findFirst({
      where: { userId, equipmentId, status: { in: ['WAITING', 'USING'] } },
    })
    if (existing) {
      res.status(409).json({ message: '이미 해당 기구에 대기 중입니다.' })
      return
    }

    const waiting = await prisma.$transaction(async (tx) => {
      const last = await tx.waitingQueue.findFirst({
        where: { equipmentId, status: 'WAITING' },
        orderBy: { queuePosition: 'desc' },
      })
      const queuePosition = (last?.queuePosition ?? 0) + 1
      return tx.waitingQueue.create({
        data: { userId, equipmentId, queuePosition, status: 'WAITING', sets, restSeconds },
        include: { equipment: true },
      })
    })

    const waitingCount = await prisma.waitingQueue.count({
      where: { equipmentId, status: 'WAITING' },
    })
    emitEquipmentUpdate(equipmentId, { equipmentId, waitingCount })
    emitEquipmentListUpdate()

    res.status(201).json({ ...waiting, waitingCount })
  } catch (err) {
    next(err)
  }
})

// POST /api/waiting/quick-start — 기구 비어있을 때 줄 서기 없이 바로 USING 등록
router.post('/quick-start', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { equipmentId, sets, restSeconds } = req.body as {
      equipmentId: number
      sets: number
      restSeconds: number
    }

    if (!equipmentId || !sets) {
      res.status(400).json({ message: '필수 항목이 누락되었습니다.' })
      return
    }

    const existing = await prisma.waitingQueue.findFirst({
      where: { userId, status: 'USING' },
    })
    if (existing) {
      res.status(409).json({ message: '이미 사용 중인 기구가 있습니다.' })
      return
    }

    const equipmentInUse = await prisma.waitingQueue.findFirst({
      where: { equipmentId, status: 'USING' },
    })
    if (equipmentInUse) {
      res.status(409).json({ message: '현재 사용 중인 기구입니다.' })
      return
    }

    const record = await prisma.waitingQueue.create({
      data: {
        userId,
        equipmentId,
        queuePosition: 0,
        status: 'USING',
        sets,
        restSeconds,
        startedAt: new Date(),
      },
      include: { equipment: true },
    })

    scheduleTimeout(`using:${record.id}`, 30 * 60 * 1000, async () => {
      try {
        const w = await prisma.waitingQueue.findUnique({ where: { id: record.id } })
        if (!w || w.status !== 'USING') return
        await completeWaiting(record.id, w.equipmentId)
      } catch (err) {
        console.error('[timeout] force complete error:', err)
      }
    })

    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
})

// GET /api/waiting/my — 내 현재 대기/사용 중 조회
router.get('/my', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    const waitings = await prisma.waitingQueue.findMany({
      where: { userId, status: { in: ['WAITING', 'USING'] } },
      include: { equipment: true },
      orderBy: { createdAt: 'desc' },
    })

    const result = await Promise.all(
      waitings.map(async (w) => {
        const waitingCount = await prisma.waitingQueue.count({
          where: { equipmentId: w.equipmentId, status: 'WAITING' },
        })
        return { ...w, waitingCount }
      })
    )

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// POST /api/waiting/:id/request — 사용 요청 (독촉 알림)
router.post('/:id/request', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const id = parseInt(req.params.id as string)

    const waiting = await prisma.waitingQueue.findUnique({ where: { id } })
    if (!waiting) {
      res.status(404).json({ message: '대기를 찾을 수 없습니다.' })
      return
    }
    if (waiting.userId !== userId) {
      res.status(403).json({ message: '권한이 없습니다.' })
      return
    }
    if (waiting.status !== 'WAITING') {
      res.status(400).json({ message: '대기 중인 상태가 아닙니다.' })
      return
    }

    const currentUser = await prisma.waitingQueue.findFirst({
      where: { equipmentId: waiting.equipmentId, status: 'USING' },
    })

    console.log('[request] equipmentId:', waiting.equipmentId, 'currentUser:', currentUser?.userId ?? 'none')

    if (!currentUser) {
      // 아무도 사용 중이 아님 = 내가 1번 → 내 차례 알림
      const equipment = await prisma.equipment.findUnique({ where: { id: waiting.equipmentId } })
      const equipmentName = equipment?.name ?? ''
      emitUserNotification(userId, {
        type: 'YOUR_TURN',
        waitingId: id,
        equipmentName,
      })
      prisma.notification.create({
        data: {
          userId,
          type: 'YOUR_TURN',
          category: 'WAITING',
          title: '내 차례예요!',
          message: `예약한 ${equipmentName}에 자리가 비었어요!`,
          equipmentId: waiting.equipmentId,
          equipmentName,
          queueId: id,
        },
      }).catch(err => console.error('[notification] YOUR_TURN 저장 실패:', err))
      res.json({ myTurn: true })
      return
    }

    // 현재 사용자에게 독촉 알림
    const waitingCount = await prisma.waitingQueue.count({
      where: { equipmentId: waiting.equipmentId, status: 'WAITING' },
    })
    console.log('[request] sending HURRY_UP to userId:', currentUser.userId, 'waitingCount:', waitingCount)
    emitUserNotification(currentUser.userId, {
      type: 'HURRY_UP',
      equipmentId: waiting.equipmentId,
      waitingCount,
    })
    const equipment = await prisma.equipment.findUnique({ where: { id: waiting.equipmentId } })
    prisma.notification.create({
      data: {
        userId: currentUser.userId,
        type: 'HURRY_UP',
        category: 'WAITING',
        title: '사용 요청이 왔어요',
        message: `내 ${equipment?.name ?? ''} 뒤에 기다리는 사람이 ${waitingCount}명 있어요`,
        equipmentId: waiting.equipmentId,
        equipmentName: equipment?.name ?? '',
        queueId: waiting.id,
      },
    }).catch(err => console.error('[notification] HURRY_UP 저장 실패:', err))

    res.json({ myTurn: false })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/waiting/:id/start — 운동 시작 (WAITING → USING)
router.patch('/:id/start', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const id = parseInt(req.params.id as string)

    const waiting = await prisma.waitingQueue.findUnique({ where: { id } })
    if (!waiting) {
      res.status(404).json({ message: '대기를 찾을 수 없습니다.' })
      return
    }
    if (waiting.userId !== userId) {
      res.status(403).json({ message: '권한이 없습니다.' })
      return
    }
    if (waiting.status !== 'WAITING') {
      res.status(400).json({ message: '대기 중인 상태가 아닙니다.' })
      return
    }

    const firstInQueue = await prisma.waitingQueue.findFirst({
      where: { equipmentId: waiting.equipmentId, status: 'WAITING' },
      orderBy: { queuePosition: 'asc' },
    })
    if (!firstInQueue || firstInQueue.userId !== userId) {
      res.status(403).json({ message: '아직 차례가 아닙니다.' })
      return
    }

    const currentUsing = await prisma.waitingQueue.findFirst({
      where: { equipmentId: waiting.equipmentId, status: 'USING' },
    })
    if (currentUsing) {
      res.status(409).json({ message: '현재 사용 중인 기구입니다.' })
      return
    }

    clearActiveTimeout(`turn:${id}`)

    const updated = await prisma.waitingQueue.update({
      where: { id },
      data: { status: 'USING', startedAt: new Date() },
      include: { equipment: true },
    })

    // 30분 초과 시 강제 완료
    scheduleTimeout(`using:${id}`, 30 * 60 * 1000, async () => {
      try {
        const w = await prisma.waitingQueue.findUnique({ where: { id } })
        if (!w || w.status !== 'USING') return
        await completeWaiting(id, w.equipmentId)
      } catch (err) {
        console.error('[timeout] force complete error:', err)
      }
    })

    emitEquipmentListUpdate()

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/waiting/:id/complete — 운동 완료 (USING → COMPLETED)
router.patch('/:id/complete', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const id = parseInt(req.params.id as string)
    const { actualWorkMs, actualRestMs } = req.body as { actualWorkMs?: number; actualRestMs?: number }

    const waiting = await prisma.waitingQueue.findUnique({ where: { id } })
    if (!waiting) {
      res.status(404).json({ message: '대기를 찾을 수 없습니다.' })
      return
    }
    if (waiting.userId !== userId) {
      res.status(403).json({ message: '권한이 없습니다.' })
      return
    }
    if (waiting.status !== 'USING') {
      res.status(400).json({ message: '사용 중인 상태가 아닙니다.' })
      return
    }

    const completedMissions = await completeWaiting(id, waiting.equipmentId, actualWorkMs, actualRestMs)

    res.json({ message: '운동이 완료되었습니다.', completedMissions })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/waiting/:id — 대기 취소 (WAITING → CANCELLED)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const id = parseInt(req.params.id as string)

    const waiting = await prisma.waitingQueue.findUnique({ where: { id } })
    if (!waiting) {
      res.status(404).json({ message: '대기를 찾을 수 없습니다.' })
      return
    }
    if (waiting.userId !== userId) {
      res.status(403).json({ message: '권한이 없습니다.' })
      return
    }
    if (waiting.status !== 'WAITING') {
      res.status(400).json({ message: '취소할 수 없는 상태입니다.' })
      return
    }

    clearActiveTimeout(`turn:${id}`)

    await prisma.$transaction([
      prisma.waitingQueue.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      prisma.waitingQueue.updateMany({
        where: {
          equipmentId: waiting.equipmentId,
          status: 'WAITING',
          queuePosition: { gt: waiting.queuePosition },
        },
        data: { queuePosition: { decrement: 1 } },
      }),
    ])

    const waitingCount = await prisma.waitingQueue.count({
      where: { equipmentId: waiting.equipmentId, status: 'WAITING' },
    })
    emitEquipmentUpdate(waiting.equipmentId, { equipmentId: waiting.equipmentId, waitingCount })
    emitEquipmentListUpdate()

    res.json({ message: '대기가 취소되었습니다.' })
  } catch (err) {
    next(err)
  }
})

export default router
