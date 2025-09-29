import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { getAdminSession } from '@/src/auth/adminSession'
import { ok, unauthorized } from '@/src/api/http'

export async function GET(_req: NextRequest) {
  const sess = await getAdminSession()
  if (!sess) return unauthorized('NOT_ADMIN')
  const user = await prisma.user.findUnique({ where: { id: sess.userId }, select: { id: true, email: true, nickname: true, avatarUrl: true } })
  return ok({ id: user?.id || sess.userId, email: user?.email || sess.email, nickname: user?.nickname || null, avatarUrl: user?.avatarUrl || null })
}


