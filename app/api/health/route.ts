import { ok } from '@/src/api/http'
import { checkDatabaseHealth } from '@/src/db/client'
import { memoryCache } from '@/src/cache/memory'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // 基础健康检查
    const [dbHealth] = await Promise.all([
      checkDatabaseHealth()
    ])
    
    const totalTime = Date.now() - startTime
    const cacheStats = memoryCache.getStats()
    
    // 健康状态判定
    const isHealthy = (
      dbHealth.status === 'healthy' &&
      dbHealth.latency < 1000 &&
      totalTime < 2000
    )
    
    const status = isHealthy ? 'healthy' : 'unhealthy'
    const httpStatus = isHealthy ? 200 : 503
    
    return ok({
      status,
      timestamp: new Date().toISOString(),
      responseTime: totalTime,
      checks: {
        database: dbHealth,
        cache: {
          status: cacheStats.valid > 0 ? 'active' : 'empty',
          hitRate: cacheStats.hitRate,
          itemCount: cacheStats.valid
        }
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: 'Health check failed'
    }, { status: 503 })
  }
}