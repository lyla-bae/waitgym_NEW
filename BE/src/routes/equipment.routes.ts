import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import type { AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// GET /api/equipment — 목록 (카테고리 필터, 검색, 즐겨찾기 여부)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const { category, search, favorites } = req.query
  const userId = req.userId!

  const where: Record<string, unknown> = {}
  if (category && category !== '전체') where.category = category
  if (search) where.name = { contains: search as string }

  const equipments = await prisma.equipment.findMany({
    where,
    include: {
      favorites: { where: { userId } },
      equipmentUsages: {
        where: { status: 'IN_USE' },
        take: 1,
        orderBy: { startedAt: 'desc' },
      },
      _count: {
        select: { waitingQueues: { where: { status: 'WAITING' } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  let result = equipments.map((e) => ({
    ...e,
    isFavorite: e.favorites.length > 0,
    currentUsage: e.equipmentUsages[0] ?? null,
    waitingCount: e._count.waitingQueues,
    favorites: undefined,
    equipmentUsages: undefined,
    _count: undefined,
  }))

  if (favorites === 'true') {
    result = result.filter((e) => e.isFavorite)
  }

  res.json(result)
})

// GET /api/equipment/:id — 상세
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string)
  const userId = req.userId!

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      favorites: { where: { userId } },
      equipmentUsages: {
        where: { status: 'IN_USE' },
        take: 1,
        orderBy: { startedAt: 'desc' },
      },
      waitingQueues: {
        where: { status: 'WAITING' },
        orderBy: { queuePosition: 'asc' },
      },
    },
  })

  if (!equipment) {
    res.status(404).json({ message: '기구를 찾을 수 없습니다.' })
    return
  }

  res.json({
    ...equipment,
    isFavorite: equipment.favorites.length > 0,
    currentUsage: equipment.equipmentUsages[0] ?? null,
    waitingCount: equipment.waitingQueues.length,
  })
})

// POST /api/equipment/:id/favorite — 즐겨찾기 토글
router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res) => {
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
})

export default router
