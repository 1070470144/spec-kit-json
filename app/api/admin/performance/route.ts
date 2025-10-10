import { ok } from '@/src/api/http'
import { memoryCache } from '@/src/cache/memory'
import { perfStats } from '@/src/utils/performance'
import { checkDatabaseHealth } from '@/src/db/client'

export async function GET() {
  try {
    // 收集性能数据
    const [dbHealth] = await Promise.all([
      checkDatabaseHealth()
    ])
    
    const cacheStats = memoryCache.getStats()
    const performanceStats = perfStats.getStats()
    
    // 系统信息
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV
    }
    
    return ok({
      timestamp: new Date().toISOString(),
      database: dbHealth,
      cache: cacheStats,
      performance: performanceStats,
      system: systemInfo
    })
  } catch (error) {
    console.error('Performance monitoring error:', error)
    return Response.json(
      { error: 'Failed to collect performance data' },
      { status: 500 }
    )
  }
}

// 清理缓存
export async function DELETE() {
  try {
    memoryCache.clear()
    perfStats.reset()
    
    return ok({ 
      message: 'Cache and performance stats cleared successfully' 
    })
  } catch (error) {
    console.error('Cache clear error:', error)
    return Response.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
