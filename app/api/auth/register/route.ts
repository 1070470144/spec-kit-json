import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { parseJson } from '@/src/api/validate'
import { badRequest, ok } from '@/src/api/http'
import { hashPassword } from '@/src/auth/password'
import { sendMail } from '@/src/auth/mailer'
import { prisma as db } from '@/src/db/client'

const schema = z.object({ email: z.string().email(), password: z.string().min(6), nickname: z.string().optional() })

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    // 检查注册开关
    console.log(`[DB QUERY] register-config-query`)
    const configStartTime = Date.now()
    
    const cfg = await (db as any)["systemConfig"].findUnique({ 
      where: { key: 'system.openRegister' },
      select: { value: true }
    })
    
    const configDuration = Date.now() - configStartTime
    if (configDuration > 50) {
      console.warn(`[SLOW QUERY] register-config - ${configDuration}ms`)
    }
    
    if (cfg && cfg.value === 'false') {
      const duration = Date.now() - startTime
      console.log(`[API] POST /api/auth/register - ${duration}ms (register closed)`)
      return badRequest('REGISTER_CLOSED')
    }
    
    const parsed = await parseJson(req, schema)
    if (!parsed.ok) {
      const duration = Date.now() - startTime
      console.log(`[API] POST /api/auth/register - ${duration}ms (invalid input)`)
      return parsed.res
    }
    
    const { email, password, nickname } = parsed.data

    // 检查用户是否已存在
    console.log(`[DB QUERY] register-user-check - ${email}`)
    const userCheckStartTime = Date.now()
    
    const exist = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true }
    })
    
    const userCheckDuration = Date.now() - userCheckStartTime
    if (userCheckDuration > 50) {
      console.warn(`[SLOW QUERY] register-user-check - ${userCheckDuration}ms`)
    }
    
    if (exist) {
      const duration = Date.now() - startTime
      console.log(`[API] POST /api/auth/register - ${duration}ms (email exists)`)
      return badRequest('EMAIL_EXISTS')
    }

    // 生成验证码并写入 PendingRegistration
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    
    console.log(`[DB QUERY] register-pending-upsert - ${email}`)
    const upsertStartTime = Date.now()
    
    await (prisma as any)["pendingRegistration"].upsert({
      where: { email },
      update: { passwordHash: hashPassword(password), nickname, code, expiresAt },
      create: { email, passwordHash: hashPassword(password), nickname, code, expiresAt }
    })
    
    const upsertDuration = Date.now() - upsertStartTime
    if (upsertDuration > 100) {
      console.warn(`[SLOW QUERY] register-pending-upsert - ${upsertDuration}ms`)
    }

    // 异步发送邮件和日志（不阻塞响应）
    setImmediate(async () => {
      try {
        await sendMail({ 
          to: email, 
          subject: '验证你的邮箱', 
          text: `你的验证码是：${code}\n10分钟内有效。` 
        })
      } catch (error) {
        console.error('[EMAIL ERROR]', error)
      }
    })

    setImmediate(async () => {
      try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
        const ua = req.headers.get('user-agent') || ''
        await prisma.auditLog.create({ 
          data: { 
            actorId: null as any, 
            action: 'user_register', 
            objectType: 'user', 
            objectId: email, 
            result: 'pending', 
            ip, 
            userAgent: ua 
          } 
        })
      } catch (error) {
        console.error('[AUDIT LOG ERROR]', error)
      }
    })

    const duration = Date.now() - startTime
    console.log(`[API] POST /api/auth/register - ${duration}ms (success) - email: ${email}`)

    return ok({ ok: true })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] POST /api/auth/register - ${duration}ms:`, error)
    return badRequest('REGISTER_FAILED')
  }
}
