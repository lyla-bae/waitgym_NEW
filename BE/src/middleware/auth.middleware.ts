import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/prisma'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthRequest extends Request {
  userId?: number
  userEmail?: string
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ message: '인증 토큰이 없습니다.' })
    return
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' })
    return
  }

  // DB에서 유저 조회 (없으면 생성)
  let dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!,
        googleId: user.user_metadata?.provider_id,
        avatar: user.user_metadata?.avatar_url,
      },
    })
  }

  req.userId = dbUser.id
  req.userEmail = dbUser.email
  next()
}
