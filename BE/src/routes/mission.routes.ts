import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 미션 — 4일차 구현
router.get('/', authMiddleware, (_req, res) => {
  res.json([])
})

export default router
