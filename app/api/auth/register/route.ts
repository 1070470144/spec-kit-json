import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { badRequest, ok } from '@/src/api/http'
import { hashPassword } from '@/src/auth/password'
import crypto from 'crypto'
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

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000)
  await prisma.verificationToken.create({ data: { userId: user.id, token, expiresAt } })

  const base = process.env.APP_BASE_URL || 'http://localhost:3000'
  const link = `${base}/verify/${token}`
  await sendMail({ to: email, subject: '验证你的邮箱', text: `点击链接验证：\n${link}` })

  return ok({ id: user.id })
}
