import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { emitEquipmentUpdate, emitUserNotification } from '../socket/socket.server'
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
      await notifyNextUser(equipmentId)
    } catch (err) {
      console.error('[timeout] turn timeout error:', err)
    }
  })
}

// 운동 완료 처리 (USING → COMPLETED) + 다음 대기자 알림
async function completeWaiting(id: number, equipmentId: number) {
  clearActiveTimeout(`using:${id}`)

  await prisma.waitingQueue.update({
    where: { id },
    data: { status: 'COMPLETED' },
  })

  const waitingCount = await prisma.waitingQueue.count({ where: { equipmentId, status: 'WAITING' } })
  emitEquipmentUpdate(equipmentId, { equipmentId, waitingCount })
  await notifyNextUser(equipmentId)
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

    if (!currentUser) {
      // 아무도 사용 중이 아님 = 내가 1번 → 내 차례 알림
      const equipment = await prisma.equipment.findUnique({ where: { id: waiting.equipmentId } })
      emitUserNotification(userId, {
        type: 'YOUR_TURN',
        waitingId: id,
        equipmentName: equipment?.name ?? '',
      })
      res.json({ myTurn: true })
      return
    }

    // 현재 사용자에게 독촉 알림
    const waitingCount = await prisma.waitingQueue.count({
      where: { equipmentId: waiting.equipmentId, status: 'WAITING' },
    })
    emitUserNotification(currentUser.userId, {
      type: 'HURRY_UP',
      equipmentId: waiting.equipmentId,
      waitingCount,
    })

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

    // 1시간 초과 시 강제 완료
    scheduleTimeout(`using:${id}`, 30 * 60 * 1000, async () => {
      try {
        const w = await prisma.waitingQueue.findUnique({ where: { id } })
        if (!w || w.status !== 'USING') return
        await completeWaiting(id, w.equipmentId)
      } catch (err) {
        console.error('[timeout] force complete error:', err)
      }
    })

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

    await completeWaiting(id, waiting.equipmentId)

    res.json({ message: '운동이 완료되었습니다.' })
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

    res.json({ message: '대기가 취소되었습니다.' })
  } catch (err) {
    next(err)
  }
})

export default router
