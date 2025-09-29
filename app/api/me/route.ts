import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'
import { ok } from '@/src/api/http'

export async function GET() {
  const s = await getSession()
  if (!s) return ok(null)
  const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { id: true, email: true, nickname: true, avatarUrl: true } })
  return ok(u)
}


