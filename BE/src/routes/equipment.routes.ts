import { Router, type NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import { calcEstimatedWaitMs } from '../lib/waitUtils'
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
      const { estimatedWaitMs, isMyCurrentUsage, isBeingUsed } = calcEstimatedWaitMs(e.waitingQueues, userId)

      return {
        ...e,
        isFavorite: e.favorites.length > 0,
        waitingCount: e._count.waitingQueues,
        isBeingUsed,
        isMyCurrentUsage,
        estimatedWaitMs,
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

    const [equipment, queues] = await Promise.all([
      prisma.equipment.findUnique({
        where: { id },
        include: { favorites: { where: { userId } } },
      }),
      prisma.waitingQueue.findMany({
        where: { equipmentId: id, status: { in: ['USING', 'WAITING'] } },
        select: { status: true, sets: true, restSeconds: true, userId: true, startedAt: true },
        orderBy: { queuePosition: 'asc' },
      }),
    ])

    if (!equipment) {
      res.status(404).json({ message: '기구를 찾을 수 없습니다.' })
      return
    }

    const { estimatedWaitMs, isMyCurrentUsage, isBeingUsed } = calcEstimatedWaitMs(queues, userId)
    const waitingCount = queues.filter((q) => q.status === 'WAITING').length

    res.json({
      ...equipment,
      isFavorite: equipment.favorites.length > 0,
      waitingCount,
      isBeingUsed,
      isMyCurrentUsage,
      estimatedWaitMs,
      favorites: undefined,
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
