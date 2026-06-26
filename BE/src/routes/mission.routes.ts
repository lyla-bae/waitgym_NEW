import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import type { AuthRequest } from '../middleware/auth.middleware'

const router = Router()

// GET /api/missions — 전체 미션 + 내 진행도
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    const [missions, userMissions] = await Promise.all([
      prisma.mission.findMany({ where: { isActive: true } }),
      prisma.userMission.findMany({ where: { userId } }),
    ])

    const result = missions.map((m) => {
      const um = userMissions.find((u) => u.missionId === m.id)
      return {
        ...m,
        progress: um?.progress ?? 0,
        isCompleted: um?.isCompleted ?? false,
        completedAt: um?.completedAt ?? null,
      }
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/missions/ranking — 포인트 기준 상위 10명
router.get('/ranking', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!

    const topUsers = await prisma.user.findMany({
      where: { points: { gt: 0 } },
      orderBy: { points: 'desc' },
      take: 10,
      select: { id: true, name: true, avatar: true, points: true },
    })

    res.json({ ranking: topUsers, myId: userId })
  } catch (err) {
    next(err)
  }
})

export default router
