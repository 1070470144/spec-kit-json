import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { badRequest, ok } from '@/src/api/http'
import { hashPassword } from '@/src/auth/password'
import { sendMail } from '@/src/auth/mailer'
import { prisma as db } from '@/src/db/client'

const schema = z.object({ email: z.string().email(), password: z.string().min(6), nickname: z.string().optional() })

export async function POST(req: Request) {
  const cfg = await (db as any)["systemConfig"].findUnique({ where: { key: 'system.openRegister' } })
  if (cfg && cfg.value === 'false') {
    return badRequest('REGISTER_CLOSED')
  }
  const parsed = await parseJson(req, schema)
  if (!parsed.ok) return parsed.res
  const { email, password, nickname } = parsed.data

  const exist = await prisma.user.findUnique({ where: { email } })
  if (exist) return badRequest('EMAIL_EXISTS')

  // 生成验证码并写入 PendingRegistration，而不是直接创建用户
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await (prisma as any)["pendingRegistration"].upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), nickname, code, expiresAt },
    create: { email, passwordHash: hashPassword(password), nickname, code, expiresAt }
  })

  await sendMail({ to: email, subject: '验证你的邮箱', text: `你的验证码是：${code}\n10分钟内有效。` })

  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ua = req.headers.get('user-agent') || ''
    await prisma.auditLog.create({ data: { actorId: null as any, action: 'user_register', objectType: 'user', objectId: email, result: 'pending', ip, userAgent: ua } })
  } catch {}
  return ok({ ok: true })
}
