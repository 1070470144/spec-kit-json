import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'
import { ok } from '@/src/api/http'
import { getCachedData, CACHE_CONFIG } from '@/src/cache/api-cache'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const session = await getSession()
    if (!session) {
      console.log(`[API] GET /api/me - ${Date.now() - startTime}ms (no session)`)
      return ok(null)
    }
    
    const user = await getCachedData(
      CACHE_CONFIG.USER_PROFILE(session.userId),
      async () => {
        console.log(`[DB QUERY] user-profile-${session.userId}-query`)
        const queryStartTime = Date.now()
        
        const result = await prisma.user.findUnique({ 
          where: { id: session.userId },
          select: { 
            id: true, 
            email: true, 
            nickname: true, 
            avatarUrl: true, 
            storytellerLevel: true 
          }
        })
        
        const queryDuration = Date.now() - queryStartTime
        if (queryDuration > 100) {
          console.warn(`[SLOW QUERY] user-profile - ${queryDuration}ms`)
        }
        
        return result
      }
    )
    
    const duration = Date.now() - startTime
    console.log(`[API] GET /api/me - ${duration}ms`)
    
    return ok(user)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] GET /api/me - ${duration}ms:`, error)
    return ok(null)
  }
}


