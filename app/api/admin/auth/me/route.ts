import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { getSession } from '@/src/auth/session'
import { ok, unauthorized, forbidden } from '@/src/api/http'

export async function GET(_req: NextRequest) {
  const sess = await getSession()
  if (!sess) return unauthorized('NOT_LOGGED_IN')
  if (sess.role !== 'admin') return forbidden('NOT_ADMIN')
  
  const user = await prisma.user.findUnique({ where: { id: sess.userId }, select: { id: true, email: true, nickname: true, avatarUrl: true } })
  return ok({ id: user?.id || sess.userId, email: user?.email || sess.email, nickname: user?.nickname || null, avatarUrl: user?.avatarUrl || null })
}


