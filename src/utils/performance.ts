/**
 * 性能监控工具
 * 用于测量API响应时间和识别性能瓶颈
 */

// 性能指标接口
interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

// 性能监控类
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>()
  private readonly slowThreshold: number

  constructor(slowThreshold = 1000) {
    this.slowThreshold = slowThreshold
  }

  // 开始测量
  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: Date.now(),
      metadata
    })
  }

  // 结束测量
  end(name: string): number {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`[PERF] Metric '${name}' not found`)
      return 0
    }

    const endTime = Date.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    // 记录结果
    const level = duration > this.slowThreshold ? 'WARN' : 'INFO'
    console.log(`[PERF ${level}] ${name} - ${duration}ms`, metric.metadata || '')

    // 清理
    this.metrics.delete(name)

    return duration
  }

  // 获取所有指标
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }
}

// 全局性能监控实例
export const perfMonitor = new PerformanceMonitor(500) // 500ms慢查询阈值

// 装饰器函数 - 自动测量函数性能
export function withPerformance<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const startTime = Date.now()
    
    try {
      const result = fn(...args)
      
      // 处理异步函数
      if (result instanceof Promise) {
        return result
          .then((data) => {
            const duration = Date.now() - startTime
            console.log(`[PERF] ${name} - ${duration}ms`)
            return data
          })
          .catch((error) => {
            const duration = Date.now() - startTime
            console.error(`[PERF ERROR] ${name} - ${duration}ms`, error)
            throw error
          })
      }
      
      // 处理同步函数
      const duration = Date.now() - startTime
      console.log(`[PERF] ${name} - ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[PERF ERROR] ${name} - ${duration}ms`, error)
      throw error
    }
  }) as T
}

// API中间件 - 自动测量API性能
export function withApiPerformance(handler: Function, routeName?: string) {
  return async (req: any, ...args: any[]) => {
    const method = req.method || 'UNKNOWN'
    const url = req.url || req.nextUrl?.pathname || 'UNKNOWN'
    const name = routeName || `${method} ${url}`
    
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substr(2, 9)
    
    console.log(`[API START] ${name} [${requestId}]`)
    
    try {
      const result = await handler(req, ...args)
      const duration = Date.now() - startTime
      
      // 记录成功的API调用
      const status = result?.status || 200
      console.log(`[API SUCCESS] ${name} [${requestId}] - ${duration}ms (${status})`)
      
      // 慢API警告
      if (duration > 500) {
        console.warn(`[SLOW API] ${name} [${requestId}] - ${duration}ms - Consider optimization!`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[API ERROR] ${name} [${requestId}] - ${duration}ms`, error)
      throw error
    }
  }
}

// 数据库查询性能测量
export async function measureDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  expectedRows?: number
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await queryFn()
    const duration = Date.now() - startTime
    
    // 计算行数（如果结果是数组）
    const rowCount = Array.isArray(result) ? result.length : 1
    const rowInfo = expectedRows ? `${rowCount}/${expectedRows} rows` : `${rowCount} rows`
    
    console.log(`[DB QUERY] ${queryName} - ${duration}ms (${rowInfo})`)
    
    // 慢查询警告
    if (duration > 100) {
      console.warn(`[SLOW QUERY] ${queryName} - ${duration}ms - Consider adding index or optimizing query`)
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[DB ERROR] ${queryName} - ${duration}ms`, error)
    throw error
  }
}

// 性能统计收集器
class PerformanceStats {
  private stats = new Map<string, { 
    count: number; 
    totalTime: number; 
    minTime: number; 
    maxTime: number; 
    avgTime: number;
  }>()

  record(name: string, duration: number): void {
    const existing = this.stats.get(name)
    
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.minTime = Math.min(existing.minTime, duration)
      existing.maxTime = Math.max(existing.maxTime, duration)
      existing.avgTime = existing.totalTime / existing.count
    } else {
      this.stats.set(name, {
        count: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
        avgTime: duration
      })
    }
  }

  getStats(): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const [name, stat] of this.stats.entries()) {
      result[name] = {
        ...stat,
        avgTime: Math.round(stat.avgTime * 100) / 100 // 保留2位小数
      }
    }
    
    return result
  }

  reset(): void {
    this.stats.clear()
  }

  // 生成性能报告
  generateReport(): string {
    const stats = this.getStats()
    const sortedStats = Object.entries(stats).sort((a, b) => b[1].avgTime - a[1].avgTime)
    
    let report = '\n=== 性能统计报告 ===\n'
    report += 'API/Query                     Count    Avg      Min      Max      Total\n'
    report += '─'.repeat(70) + '\n'
    
    for (const [name, stat] of sortedStats) {
      const nameStr = name.padEnd(30)
      const countStr = stat.count.toString().padStart(8)
      const avgStr = `${stat.avgTime}ms`.padStart(8)
      const minStr = `${stat.minTime}ms`.padStart(8)
      const maxStr = `${stat.maxTime}ms`.padStart(8)
      const totalStr = `${stat.totalTime}ms`.padStart(10)
      
      report += `${nameStr} ${countStr} ${avgStr} ${minStr} ${maxStr} ${totalStr}\n`
    }
    
    return report
  }
}

export const perfStats = new PerformanceStats()

// 自动记录性能统计的装饰器
export function withPerfStats<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const startTime = Date.now()
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result
          .then((data) => {
            const duration = Date.now() - startTime
            perfStats.record(name, duration)
            return data
          })
          .catch((error) => {
            const duration = Date.now() - startTime
            perfStats.record(`${name}_ERROR`, duration)
            throw error
          })
      }
      
      const duration = Date.now() - startTime
      perfStats.record(name, duration)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      perfStats.record(`${name}_ERROR`, duration)
      throw error
    }
  }) as T
}

// 定期打印性能报告 (仅在服务器端)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const report = perfStats.generateReport()
    if (Object.keys(perfStats.getStats()).length > 0) {
      console.log(report)
      perfStats.reset() // 重置统计
    }
  }, 60000) // 每分钟输出一次报告
}
