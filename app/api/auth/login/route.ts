import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { verifyPassword } from '@/src/auth/password'
import { signSession, setSessionCookie } from '@/src/auth/session'
import { parseJson } from '@/src/api/validate'
import { unauthorized, ok } from '@/src/api/http'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    const parsed = await parseJson(req, schema)
    if (!parsed.ok) {
      const duration = Date.now() - startTime
      console.log(`[API] POST /api/auth/login - ${duration}ms (invalid input)`)
      return parsed.res
    }
    
    const { email, password } = parsed.data
    
    // 优化的用户查询 - 一次性获取所有需要的信息
    console.log(`[DB QUERY] login-user-query - ${email}`)
    const queryStartTime = Date.now()
    
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        emailVerifiedAt: true,
        roles: { select: { key: true } }
      }
    })
    
    const queryDuration = Date.now() - queryStartTime
    if (queryDuration > 100) {
      console.warn(`[SLOW QUERY] login-user - ${queryDuration}ms`)
    }
    
    if (!user || !verifyPassword(password, user.passwordHash)) {
      const duration = Date.now() - startTime
      console.log(`[API] POST /api/auth/login - ${duration}ms (invalid credentials)`)
      return unauthorized('INVALID_CREDENTIALS')
    }
    
    if (!user.emailVerifiedAt) {
      const duration = Date.now() - startTime
      console.log(`[API] POST /api/auth/login - ${duration}ms (email not verified)`)
      return unauthorized('EMAIL_NOT_VERIFIED')
    }
    
    // 检查管理员角色
    const isAdmin = user.roles.some(r => r.key === 'admin' || r.key === 'superuser')
    const role = isAdmin ? 'admin' : 'user'
    
    // 生成会话
    const token = signSession({ userId: user.id, email: user.email, role })
    await setSessionCookie(token)
    
    // 异步记录审计日志（不阻塞响应）
    setImmediate(async () => {
      try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
        const ua = req.headers.get('user-agent') || ''
        await prisma.auditLog.create({ 
          data: { 
            actorId: user.id, 
            action: 'user_login', 
            objectType: 'user', 
            objectId: user.id, 
            result: 'ok', 
            ip, 
            userAgent: ua 
          } 
        })
      } catch (error) {
        console.error('[AUDIT LOG ERROR]', error)
      }
    })
    
    const duration = Date.now() - startTime
    console.log(`[API] POST /api/auth/login - ${duration}ms (success) - role: ${role}`)
    
    return ok({ id: user.id, email: user.email, role })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] POST /api/auth/login - ${duration}ms:`, error)
    return unauthorized('LOGIN_FAILED')
  }
}
