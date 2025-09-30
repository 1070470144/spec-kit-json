import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, badRequest } from '@/src/api/http'
import { verifyPassword, hashPassword } from '@/src/auth/password'

export async function POST(req: Request) {
  const s = await getSession()
  if (!s) return unauthorized()
  const b = await req.json().catch(()=>null) as { oldPassword?: string; newPassword?: string }
  if (!b?.oldPassword || !b?.newPassword) return badRequest('MISSING_FIELDS')
  const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { id: true, passwordHash: true } })
  if (!u || !verifyPassword(b.oldPassword, u.passwordHash)) return unauthorized('INVALID_PASSWORD')
  const newHash = hashPassword(b.newPassword)
  await prisma.user.update({ where: { id: s.userId }, data: { passwordHash: newHash } })
  return ok(true)
}


