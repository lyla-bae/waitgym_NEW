import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 웨이팅 관련 라우트 — 3일차에 상세 구현
router.get('/my', authMiddleware, (_req, res) => {
  res.json([])
})

export default router
