import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { emitEquipmentUpdate } from '../socket/socket.server'
import type { AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// POST /api/waiting — 대기 등록
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
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
    where: { userId, status: 'WAITING' },
  })
  if (existing) {
    res.status(409).json({ message: '이미 대기 중인 기구가 있습니다.' })
    return
  }

  const last = await prisma.waitingQueue.findFirst({
    where: { equipmentId, status: 'WAITING' },
    orderBy: { queuePosition: 'desc' },
  })
  const queuePosition = (last?.queuePosition ?? 0) + 1

  const waiting = await prisma.waitingQueue.create({
    data: { userId, equipmentId, queuePosition, status: 'WAITING' },
    include: { equipment: true },
  })

  const waitingCount = await prisma.waitingQueue.count({
    where: { equipmentId, status: 'WAITING' },
  })
  emitEquipmentUpdate(equipmentId, { equipmentId, waitingCount })

  res.status(201).json({ ...waiting, queuePosition, waitingCount })
})

// GET /api/waiting/my — 내 현재 대기 조회
router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!

  const waitings = await prisma.waitingQueue.findMany({
    where: { userId, status: 'WAITING' },
    include: {
      equipment: true,
    },
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
})

// DELETE /api/waiting/:id — 대기 취소
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
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

  await prisma.waitingQueue.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  // 취소된 순서 뒤 사람들 queuePosition 재정렬
  await prisma.waitingQueue.updateMany({
    where: {
      equipmentId: waiting.equipmentId,
      status: 'WAITING',
      queuePosition: { gt: waiting.queuePosition },
    },
    data: { queuePosition: { decrement: 1 } },
  })

  const waitingCount = await prisma.waitingQueue.count({
    where: { equipmentId: waiting.equipmentId, status: 'WAITING' },
  })
  emitEquipmentUpdate(waiting.equipmentId, { equipmentId: waiting.equipmentId, waitingCount })

  res.json({ message: '대기가 취소되었습니다.' })
})

export default router
