import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/users/me — 내 정보
router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// GET /api/users/notifications — 내 알림 목록 (최근 7일)
router.get('/notifications', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 7)

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId!,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(notifications)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/users/me — 회원 탈퇴
router.delete('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    // Supabase Auth 먼저 삭제 — 실패 시 DB는 그대로 유지
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.supabaseUserId!)
    if (error) {
      next(error)
      return
    }
    await prisma.user.delete({ where: { id: req.userId } })
    res.json({ message: '탈퇴가 완료되었습니다.' })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/users/notifications/read-all — 전체 읽음 처리
router.patch('/notifications/read-all', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
