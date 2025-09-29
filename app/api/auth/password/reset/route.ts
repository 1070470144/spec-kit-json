import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok, badRequest } from '@/src/api/http'
import { hashPassword } from '@/src/auth/password'

const schema = z.object({ token: z.string().min(10), password: z.string().min(6) })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { token, password } = parsed.data

  const rt = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!rt) return badRequest('TOKEN_INVALID')
  if (rt.expiresAt < new Date()) return badRequest('TOKEN_EXPIRED')

  await prisma.$transaction([
    prisma.user.update({ where: { id: rt.userId }, data: { passwordHash: hashPassword(password) } }),
    prisma.passwordResetToken.delete({ where: { token } })
  ])

  return ok({})
}
