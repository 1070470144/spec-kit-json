import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { verifyPassword } from '@/src/auth/password'
import { parseJson } from '@/src/api/validate'
import { unauthorized, ok, forbidden } from '@/src/api/http'
import { signSession, setSessionCookie } from '@/src/auth/session'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, passwordHash: true, roles: { select: { key: true } } } })
  if (!user || !verifyPassword(password, user.passwordHash)) return unauthorized('INVALID_CREDENTIALS')
  const roleKeys = (user.roles||[]).map(r=>r.key)
  const isAdmin = roleKeys.includes('admin') || roleKeys.includes('superuser')
  if (!isAdmin) return forbidden('NOT_ADMIN')
  
  // 统一使用session，通过role字段区分管理员和普通用户
  const token = signSession({ userId: user.id, email: user.email, role: 'admin' })
  await setSessionCookie(token)
  
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ua = req.headers.get('user-agent') || ''
    await prisma.auditLog.create({ data: { actorId: user.id, action: 'admin_login', objectType: 'user', objectId: user.id, result: 'ok', ip, userAgent: ua } })
  } catch {}
  
  return ok({ id: user.id, email: user.email, role: 'admin' })
}
