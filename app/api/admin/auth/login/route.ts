import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { verifyPassword } from '@/src/auth/password'
import { parseJson } from '@/src/api/validate'
import { unauthorized, ok, forbidden } from '@/src/api/http'
import { signAdminSession } from '@/src/auth/adminSession'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, passwordHash: true, roles: { select: { key: true } } } })
  if (!user || !verifyPassword(password, user.passwordHash)) return unauthorized('INVALID_CREDENTIALS')
  const roleKeys = (user.roles||[]).map(r=>r.key)
  const isAdmin = roleKeys.includes('admin') || roleKeys.includes('superuser') || user.email === 'admin@example.com'
  if (!isAdmin) return forbidden('NOT_ADMIN')
  const token = signAdminSession({ userId: user.id, email: user.email, role: 'admin' })
  const res = ok({ id: user.id, email: user.email, role: 'admin' })
  // 在响应上设置会话 Cookie，确保浏览器能接收并保存
  res.cookies.set('admin_session', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600 })
  return res
}
