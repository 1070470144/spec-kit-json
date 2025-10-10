/**
 * 安全的API缓存系统
 * 专为服务端API设计，避免客户端冲突
 */

interface CacheConfig {
  ttl: number // 缓存时间(秒)
  key: string // 缓存键
}

interface CacheItem<T> {
  data: T
  expires: number
  created: number
}

// 仅服务端运行的安全缓存
class ApiCache {
  private cache = new Map<string, CacheItem<any>>()
  private readonly maxSize = 5000
  
  constructor() {
    // 仅在服务端启动清理定时器
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  set<T>(key: string, data: T, ttlSeconds = 300): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
      created: Date.now()
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item || item.expires < Date.now()) {
      if (item) this.cache.delete(key)
      return null
    }
    return item.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key)
      }
    }
  }

  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (item.created < oldestTime) {
        oldestTime = item.created
        oldestKey = key
      }
    }
    
    if (oldestKey) this.cache.delete(oldestKey)
  }

  getStats() {
    const now = Date.now()
    const valid = Array.from(this.cache.values()).filter(item => item.expires > now).length
    return {
      total: this.cache.size,
      valid,
      expired: this.cache.size - valid
    }
  }
}

// 全局API缓存实例
export const apiCache = new ApiCache()

// 缓存配置
export const CACHE_CONFIG = {
  // 站点配置 - 30分钟
  SITE_CONFIG: { ttl: 1800, key: 'site-config' },
  
  // 用户信息 - 5分钟  
  USER_PROFILE: (userId: string) => ({ ttl: 300, key: `user-${userId}` }),
  
  // 剧本列表 - 10分钟
  SCRIPTS_LIST: (params: string) => ({ ttl: 600, key: `scripts-${params}` }),
  
  // 剧本详情 - 15分钟
  SCRIPT_DETAIL: (id: string) => ({ ttl: 900, key: `script-${id}` }),
  
  // 排行榜 - 5分钟
  LEADERBOARD: (type: string) => ({ ttl: 300, key: `leaderboard-${type}` }),
  
  // 评论列表 - 2分钟
  COMMENTS: (scriptId: string) => ({ ttl: 120, key: `comments-${scriptId}` }),
  
  // 统计数据 - 10分钟
  STATS: (scriptId: string) => ({ ttl: 600, key: `stats-${scriptId}` }),
  
  // 管理员数据 - 1分钟
  ADMIN_DATA: (type: string, params: string) => ({ ttl: 60, key: `admin-${type}-${params}` })
} as const

// 安全的缓存获取函数
export async function getCachedData<T>(
  config: CacheConfig,
  fetcher: () => Promise<T>
): Promise<T> {
  // 尝试从缓存获取
  const cached = apiCache.get<T>(config.key)
  if (cached !== null) {
    console.log(`[CACHE HIT] ${config.key}`)
    return cached
  }

  console.log(`[CACHE MISS] ${config.key}`)
  
  try {
    // 获取新数据
    const startTime = Date.now()
    const data = await fetcher()
    const duration = Date.now() - startTime
    
    // 存入缓存
    apiCache.set(config.key, data, config.ttl)
    
    console.log(`[CACHE SET] ${config.key} - ${duration}ms`)
    return data
  } catch (error) {
    console.error(`[CACHE ERROR] ${config.key}:`, error)
    throw error
  }
}

// 批量缓存失效
export function invalidateCache(pattern: string): number {
  let count = 0
  
  for (const key of Array.from(apiCache['cache'].keys())) {
    if (key.includes(pattern)) {
      apiCache.delete(key)
      count++
    }
  }
  
  console.log(`[CACHE INVALIDATE] ${count} keys with pattern "${pattern}"`)
  return count
}

// API性能日志（仅服务端）
export function logApiPerformance(
  method: string,
  path: string,
  duration: number,
  cached = false
): void {
  if (typeof window !== 'undefined') return
  
  const cacheInfo = cached ? '[CACHED]' : ''
  const level = duration > 500 ? 'WARN' : 'INFO'
  
  console.log(`[API ${level}] ${method} ${path} - ${duration}ms ${cacheInfo}`)
  
  if (duration > 500) {
    console.warn(`[SLOW API] ${method} ${path} took ${duration}ms - Consider optimization`)
  }
}
