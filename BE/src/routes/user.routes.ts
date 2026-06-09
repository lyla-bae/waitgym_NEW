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

// GET /api/users/notifications — 내 알림 목록 (최근 7일)
router.get('/notifications', authMiddleware, async (req: AuthRequest, res) => {
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
})

// DELETE /api/users/me — 회원 탈퇴
router.delete('/me', authMiddleware, async (req: AuthRequest, res) => {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  await prisma.user.delete({ where: { id: req.userId } })
  if (user.googleId) {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers.users.find(u => u.email === user.email)
    if (authUser) await supabaseAdmin.auth.admin.deleteUser(authUser.id)
  }
  res.json({ message: '탈퇴가 완료되었습니다.' })
})

// PATCH /api/users/notifications/read-all — 전체 읽음 처리
router.patch('/notifications/read-all', authMiddleware, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId!, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  res.json({ ok: true })
})

export default router
