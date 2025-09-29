import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { badRequest, ok } from '@/src/api/http'
import { hashPassword } from '@/src/auth/password'
import { sendMail } from '@/src/auth/mailer'

const schema = z.object({ email: z.string().email(), password: z.string().min(6), nickname: z.string().optional() })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, password, nickname } = parsed.data

  const exist = await prisma.user.findUnique({ where: { email } })
  if (exist) return badRequest('EMAIL_EXISTS')

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password), nickname }
  })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await (prisma as any)["verificationToken"].create({ data: { userId: user.id, token: code, expiresAt } })

  await sendMail({ to: email, subject: '验证你的邮箱', text: `你的验证码是：${code}\n10分钟内有效。` })

  return ok({ id: user.id })
}
