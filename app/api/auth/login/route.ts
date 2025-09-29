import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { verifyPassword } from '@/src/auth/password'
import { signSession, setSessionCookie } from '@/src/auth/session'
import { parseJson } from '@/src/api/validate'
import { unauthorized, ok } from '@/src/api/http'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return unauthorized('INVALID_CREDENTIALS')
  }
  if (!user.emailVerifiedAt) {
    return unauthorized('EMAIL_NOT_VERIFIED')
  }
  const isAdmin = (await prisma.user.findUnique({ where: { id: user.id }, select: { roles: { select: { key: true } } } }))?.roles.some(r=>r.key==='admin' || r.key==='superuser')
  const role = isAdmin ? 'admin' : 'user'
  const token = signSession({ userId: user.id, email: user.email, role })
  await setSessionCookie(token)
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ua = req.headers.get('user-agent') || ''
    await prisma.auditLog.create({ data: { actorId: user.id, action: 'user_login', objectType: 'user', objectId: user.id, result: 'ok', ip, userAgent: ua } })
  } catch {}
  return ok({ id: user.id, email: user.email, role })
}
