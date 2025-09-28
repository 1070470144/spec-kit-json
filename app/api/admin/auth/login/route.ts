import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { verifyPassword } from '@/src/auth/password'
import { parseJson } from '@/src/api/validate'
import { unauthorized, ok, forbidden } from '@/src/api/http'
import { signAdminSession, setAdminSessionCookie } from '@/src/auth/adminSession'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.passwordHash)) return unauthorized('INVALID_CREDENTIALS')
  if (user.email !== 'admin@example.com') return forbidden('NOT_ADMIN')
  const token = signAdminSession({ userId: user.id, email: user.email, role: 'admin' })
  setAdminSessionCookie(token)
  return ok({ id: user.id, email: user.email, role: 'admin' })
}
