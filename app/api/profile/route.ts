import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, badRequest } from '@/src/api/http'

export async function GET() {
  const s = await getSession()
  if (!s) return ok(null)
  const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { id: true, email: true, nickname: true, avatarUrl: true } })
  return ok(u)
}

export async function PUT(req: Request) {
  const s = await getSession()
  if (!s) return unauthorized()
  const b = await req.json().catch(()=>null) as { nickname?: string; avatarUrl?: string }
  if (!b) return badRequest('INVALID_JSON')
  const u = await prisma.user.update({ where: { id: s.userId }, data: { nickname: b.nickname, avatarUrl: b.avatarUrl }, select: { id: true, email: true, nickname: true, avatarUrl: true } })
  return ok(u)
}


