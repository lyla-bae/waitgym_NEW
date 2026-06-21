import { Router, type NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import type { AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// GET /api/equipment — 목록 (카테고리 필터, 검색, 즐겨찾기 여부)
router.get('/', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const { category, search, favorites } = req.query
    const userId = req.userId!

    const where: Record<string, unknown> = {}
    if (category && category !== '전체') where.category = category
    if (search) where.name = { contains: search as string }

    const equipments = await prisma.equipment.findMany({
      where,
      include: {
        favorites: { where: { userId } },
        _count: {
          select: {
            waitingQueues: { where: { status: 'WAITING' } },
          },
        },
        waitingQueues: {
          where: { status: { in: ['USING', 'WAITING'] } },
          select: { status: true, sets: true, restSeconds: true, userId: true, startedAt: true },
          orderBy: { queuePosition: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    let result = equipments.map((e) => {
      const usingQueue = e.waitingQueues.filter((q) => q.status === 'USING')
      const waitingQueues = e.waitingQueues.filter((q) => q.status === 'WAITING')
      const usingEntry = usingQueue[0] ?? null

      let estimatedWaitMs = 0
      if (usingEntry?.startedAt) {
        const totalMs = usingEntry.sets * 3 * 60 * 1000 + (usingEntry.sets - 1) * usingEntry.restSeconds * 1000
        const elapsed = Date.now() - usingEntry.startedAt.getTime()
        estimatedWaitMs += Math.max(0, totalMs - elapsed)
      }
      for (const q of waitingQueues) {
        estimatedWaitMs += q.sets * 3 * 60 * 1000 + (q.sets - 1) * q.restSeconds * 1000
      }

      return {
        ...e,
        isFavorite: e.favorites.length > 0,
        waitingCount: e._count.waitingQueues,
        isBeingUsed: usingQueue.length > 0,
        isMyCurrentUsage: usingEntry?.userId === userId,
        estimatedWaitMs: estimatedWaitMs > 0 ? estimatedWaitMs : null,
        favorites: undefined,
        waitingQueues: undefined,
        _count: undefined,
      }
    })

    if (favorites === 'true') {
      result = result.filter((e) => e.isFavorite)
    }

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/equipment/:id — 상세
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string)
    const userId = req.userId!

    const [equipment, usingCount] = await Promise.all([
      prisma.equipment.findUnique({
        where: { id },
        include: {
          favorites: { where: { userId } },
          waitingQueues: {
            where: { status: 'WAITING' },
            orderBy: { queuePosition: 'asc' },
          },
        },
      }),
      prisma.waitingQueue.count({ where: { equipmentId: id, status: 'USING' } }),
    ])

    if (!equipment) {
      res.status(404).json({ message: '기구를 찾을 수 없습니다.' })
      return
    }

    res.json({
      ...equipment,
      isFavorite: equipment.favorites.length > 0,
      waitingCount: equipment.waitingQueues.length,
      isBeingUsed: usingCount > 0,
      favorites: undefined,
      waitingQueues: undefined,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/equipment/:id/favorite — 즐겨찾기 토글
router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res, next: NextFunction) => {
  try {
    const equipmentId = parseInt(req.params.id as string)
    const userId = req.userId!

    const existing = await prisma.favorite.findUnique({
      where: { userId_equipmentId: { userId, equipmentId } },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      res.json({ isFavorite: false })
    } else {
      await prisma.favorite.create({ data: { userId, equipmentId } })
      res.json({ isFavorite: true })
    }
  } catch (err) {
    next(err)
  }
})

export default router
