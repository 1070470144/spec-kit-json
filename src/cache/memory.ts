/**
 * 内存缓存实现 - 快速性能优化方案
 * 提供高速内存缓存，显著减少数据库查询
 */

interface CacheItem<T> {
  data: T
  expires: number
  created: number
}

class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private readonly maxSize: number
  private readonly defaultTTL: number

  constructor(maxSize = 1000, defaultTTL = 300) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    
    // 定期清理过期项 (仅在服务器端)
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
    }
  }

  set(key: string, data: T, ttlSeconds = this.defaultTTL): void {
    // 如果缓存满了，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
      created: Date.now()
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (item.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (item.expires < Date.now()) {
      this.cache.delete(key)
      return false
    }

    return true
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
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // 获取缓存统计信息
  getStats() {
    const now = Date.now()
    const valid = Array.from(this.cache.values()).filter(item => item.expires > now).length
    const expired = this.cache.size - valid
    
    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? valid / this.cache.size : 0
    }
  }
}

// 全局缓存实例
export const memoryCache = new MemoryCache(2000, 300) // 2000项，默认5分钟TTL

// 缓存助手函数
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  // 先尝试从缓存获取
  const cached = memoryCache.get(key) as T | null
  if (cached !== null) {
    console.log(`[CACHE HIT] ${key}`)
    return cached
  }

  console.log(`[CACHE MISS] ${key}`)
  
  try {
    // 获取新数据
    const data = await fetcher()
    
    // 存入缓存
    memoryCache.set(key, data, ttl)
    
    return data
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to fetch ${key}:`, error)
    throw error
  }
}

// 带性能监控的缓存函数
export async function getCachedOrFetchWithMetrics<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await getCachedOrFetch(key, fetcher, ttl)
    const duration = Date.now() - startTime
    
    console.log(`[CACHE PERF] ${key} - ${duration}ms`)
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[CACHE PERF ERROR] ${key} - ${duration}ms`, error)
    throw error
  }
}

// 批量缓存操作
export async function getCachedOrFetchBatch<T>(
  keys: string[],
  fetcher: (missingKeys: string[]) => Promise<Record<string, T>>,
  ttl = 300
): Promise<Record<string, T>> {
  const result: Record<string, T> = {}
  const missingKeys: string[] = []

  // 检查缓存
  for (const key of keys) {
    const cached = memoryCache.get(key) as T | null
    if (cached !== null) {
      result[key] = cached
    } else {
      missingKeys.push(key)
    }
  }

  // 获取缺失的数据
  if (missingKeys.length > 0) {
    const fetched = await fetcher(missingKeys)
    
    for (const [key, value] of Object.entries(fetched)) {
      memoryCache.set(key, value, ttl)
      result[key] = value
    }
  }

  console.log(`[BATCH CACHE] ${keys.length - missingKeys.length}/${keys.length} hits`)
  
  return result
}

// 缓存失效助手
export function invalidateCache(pattern: string | RegExp): number {
  let invalidated = 0
  
  if (typeof pattern === 'string') {
    // 精确匹配或前缀匹配
    for (const key of memoryCache['cache'].keys()) {
      if (key === pattern || key.startsWith(pattern)) {
        memoryCache.delete(key)
        invalidated++
      }
    }
  } else {
    // 正则匹配
    for (const key of memoryCache['cache'].keys()) {
      if (pattern.test(key)) {
        memoryCache.delete(key)
        invalidated++
      }
    }
  }
  
  console.log(`[CACHE INVALIDATE] ${invalidated} keys invalidated`)
  return invalidated
}

// 预热缓存
export async function warmupCache(
  entries: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>
): Promise<void> {
  console.log(`[CACHE WARMUP] Starting warmup for ${entries.length} entries...`)
  
  const startTime = Date.now()
  
  try {
    await Promise.all(
      entries.map(async ({ key, fetcher, ttl = 300 }) => {
        try {
          await getCachedOrFetch(key, fetcher, ttl)
        } catch (error) {
          console.warn(`[CACHE WARMUP] Failed to warmup ${key}:`, error)
        }
      })
    )
    
    const duration = Date.now() - startTime
    console.log(`[CACHE WARMUP] Completed in ${duration}ms`)
  } catch (error) {
    console.error('[CACHE WARMUP] Failed:', error)
  }
}
