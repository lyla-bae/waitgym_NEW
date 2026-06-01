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

  // 익명 유저는 email 없음 → id 기준으로 조회/생성
  const email = user.email ?? `anon_${user.id}@waitgym.local`
  let dbUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { googleId: user.id }] },
  })
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email,
        name: user.user_metadata?.full_name ?? '익명 사용자',
        googleId: user.id,
        avatar: user.user_metadata?.avatar_url,
      },
    })
  }

  req.userId = dbUser.id
  req.userEmail = dbUser.email
  next()
}
