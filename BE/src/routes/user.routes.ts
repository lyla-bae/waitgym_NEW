import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/users/me — 내 정보
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  res.json(user)
})

export default router
