import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok, badRequest } from '@/src/api/http'
import { sendMail } from '@/src/auth/mailer'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return ok({})
  if (user.emailVerifiedAt) return badRequest('ALREADY_VERIFIED')

  await (prisma as any)["verificationToken"].deleteMany({ where: { userId: user.id } })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await (prisma as any)["verificationToken"].create({ data: { userId: user.id, token: code, expiresAt } })

  await sendMail({ to: email, subject: '邮箱验证验证码', text: `你的验证码是：${code}\n10分钟内有效。` })

  return ok({})
}


