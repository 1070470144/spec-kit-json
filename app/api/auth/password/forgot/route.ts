import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { ok, badRequest } from '@/src/api/http'
import crypto from 'crypto'
import { sendMail } from '@/src/auth/mailer'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  // 为防止用户枚举，统一返回成功，但仍正常生成 token 如果用户存在
  if (user) {
    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000)
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })
    const base = process.env.APP_BASE_URL || 'http://localhost:3000'
    const link = `${base}/reset/${token}`
    await sendMail({ to: email, subject: '重置密码', text: `点击链接重置：\n${link}` })
  }
  return ok({})
}
