import { prisma } from '@/src/db/client'
import { ok } from '@/src/api/http'
import { getCachedData, CACHE_CONFIG } from '@/src/cache/api-cache'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const data = await getCachedData(
      CACHE_CONFIG.SITE_CONFIG,
      async () => {
        console.log('[DB QUERY] site-config-query')
        const queryStartTime = Date.now()
        
        const keys = ['site.version', 'site.icp', 'site.contact']
        const rows = await (prisma as any)["systemConfig"].findMany({ 
          where: { key: { in: keys } },
          select: { key: true, value: true }
        })
        
        const queryDuration = Date.now() - queryStartTime
        if (queryDuration > 100) {
          console.warn(`[SLOW QUERY] site-config - ${queryDuration}ms`)
        }
        
        const result: Record<string, string> = {}
        for (const r of rows) result[r.key] = r.value
        return result
      }
    )
    
    const duration = Date.now() - startTime
    console.log(`[API] GET /api/site-config - ${duration}ms`)
    
    return ok(data)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] GET /api/site-config - ${duration}ms:`, error)
    return ok({
      'site.version': '1.0.0',
      'site.icp': '',
      'site.contact': ''
    })
  }
}


