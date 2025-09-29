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
  const role = user.email === 'admin@example.com' ? 'admin' : 'user'
  const token = signSession({ userId: user.id, email: user.email, role })
  await setSessionCookie(token)
  return ok({ id: user.id, email: user.email, role })
}
