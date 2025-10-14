import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { getSession } from '@/src/auth/session'
import { ok, unauthorized } from '@/src/api/http'

export async function GET(_req: NextRequest) {
  const sess = await getSession()
  if (!sess) return unauthorized('NOT_LOGGED_IN')
  
  const user = await prisma.user.findUnique({ 
    where: { id: sess.userId }, 
    select: { id: true, email: true, nickname: true, avatarUrl: true, roles: true } 
  })
  
  return ok({ 
    id: user?.id || sess.userId, 
    email: user?.email || sess.email, 
    nickname: user?.nickname || null, 
    avatarUrl: user?.avatarUrl || null,
    role: sess.role,
    roles: user?.roles || []
  })
}
