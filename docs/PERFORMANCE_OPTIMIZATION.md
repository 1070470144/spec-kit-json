# API 性能优化完整方案

## 🚨 当前问题分析

**API响应时间：2秒+ (目标：<200ms)**

### 🔍 根本原因分析

1. **数据库瓶颈**
   - 使用 SQLite（单文件数据库，I/O瓶颈）
   - 缺少连接池配置
   - 缺少数据库索引优化
   - 每次请求都建立新的数据库连接

2. **应用层问题**
   - 缺少缓存机制
   - API路由没有优化
   - 会话验证每次都查询数据库
   - 没有并发处理优化

3. **系统架构问题**
   - 缺少Redis缓存层
   - 没有CDN优化
   - 缺少API响应压缩
   - 没有性能监控

---

## 🎯 完整优化方案

### 1. 数据库层优化 (🚀 最高优先级)

#### 1.1 升级到 PostgreSQL
```bash
# 安装 PostgreSQL
npm install pg @types/pg

# 更新 Prisma schema
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
# }
```

#### 1.2 配置连接池
```typescript
// src/db/client.ts - 优化版本
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20'
    }
  }
})

// 连接池配置
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
```

#### 1.3 添加关键索引
```sql
-- 添加必要的数据库索引
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_script_state ON "Script"(state);
CREATE INDEX idx_script_created_at ON "Script"("createdAt" DESC);
CREATE INDEX idx_system_config_key ON "SystemConfig"(key);
CREATE INDEX idx_session_user_id ON "Session"("userId");
CREATE INDEX idx_favorite_script_user ON "Favorite"("scriptId", "userId");
CREATE INDEX idx_like_script_user ON "Like"("scriptId", "userId");
```

### 2. 缓存层优化 (⚡ 高优先级)

#### 2.1 Redis 缓存实现
```bash
npm install redis @types/redis
```

```typescript
// src/cache/redis.ts
import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    lazyConnect: true,
  },
})

client.on('error', (err) => console.error('Redis Error:', err))

export async function getRedisClient() {
  if (!client.isOpen) {
    await client.connect()
  }
  return client
}

// 缓存助手函数
export async function getCached<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = 300
): Promise<T> {
  try {
    const redis = await getRedisClient()
    const cached = await redis.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    const data = await fetcher()
    await redis.setEx(key, ttl, JSON.stringify(data))
    return data
  } catch (error) {
    console.warn('Cache error, falling back to fetcher:', error)
    return await fetcher()
  }
}
```

#### 2.2 内存缓存 (快速方案)
```typescript
// src/cache/memory.ts
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expires: number }>()
  
  set(key: string, data: T, ttlSeconds = 300) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000
    })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item || item.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
}

export const memoryCache = new MemoryCache()

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  const cached = memoryCache.get<T>(key)
  if (cached) return cached
  
  const data = await fetcher()
  memoryCache.set(key, data, ttl)
  return data
}
```

### 3. API 路由优化

#### 3.1 优化 /api/site-config
```typescript
// app/api/site-config/route.ts - 优化版本
import { prisma } from '@/src/db/client'
import { getCachedOrFetch } from '@/src/cache/memory'
import { ok } from '@/src/api/http'
import { NextRequest } from 'next/server'

// 缓存配置 30 分钟
const CACHE_TTL = 30 * 60

export async function GET(request: NextRequest) {
  try {
    const data = await getCachedOrFetch(
      'site-config',
      async () => {
        const keys = ['site.version', 'site.icp', 'site.contact']
        const rows = await prisma.systemConfig.findMany({ 
          where: { key: { in: keys } },
          select: { key: true, value: true }
        })
        
        const config: Record<string, string> = {}
        for (const r of rows) config[r.key] = r.value
        return config
      },
      CACHE_TTL
    )
    
    return ok(data)
  } catch (error) {
    console.error('Site config error:', error)
    return ok({}, { status: 500 })
  }
}
```

#### 3.2 优化 /api/me
```typescript
// app/api/me/route.ts - 优化版本
import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'
import { getCachedOrFetch } from '@/src/cache/memory'
import { ok } from '@/src/api/http'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return ok(null)
    
    const user = await getCachedOrFetch(
      `user-profile-${session.userId}`,
      async () => {
        return await prisma.user.findUnique({ 
          where: { id: session.userId },
          select: { 
            id: true, 
            email: true, 
            nickname: true, 
            avatarUrl: true, 
            storytellerLevel: true 
          }
        })
      },
      300 // 5 分钟缓存
    )
    
    return ok(user)
  } catch (error) {
    console.error('User profile error:', error)
    return ok(null, { status: 500 })
  }
}
```

### 4. 会话优化

#### 4.1 会话缓存
```typescript
// src/auth/session.ts - 优化版本
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { getCachedOrFetch } from '@/src/cache/memory'

// ... existing code ...

let sessionCache: Map<string, SessionPayload> = new Map()

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  
  if (!token) return null
  
  // 先检查内存缓存
  const cached = sessionCache.get(token)
  if (cached && cached.exp > Math.floor(Date.now() / 1000)) {
    return cached
  }
  
  const session = verifySessionToken(token)
  if (session) {
    sessionCache.set(token, session)
    // 清理过期缓存
    for (const [key, value] of sessionCache) {
      if (value.exp < Math.floor(Date.now() / 1000)) {
        sessionCache.delete(key)
      }
    }
  }
  
  return session
}
```

### 5. 数据库查询优化

#### 5.1 Prisma 查询优化
```typescript
// 使用 select 减少数据传输
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    nickname: true,
    avatarUrl: true,
    storytellerLevel: true,
    // 只选择需要的字段
  }
})

// 批量查询优化
const [configs, userProfiles] = await Promise.all([
  prisma.systemConfig.findMany(...),
  prisma.user.findMany(...)
])

// 使用 include 代替多次查询
const scriptsWithStats = await prisma.script.findMany({
  include: {
    _count: {
      select: {
        likes: true,
        favorites: true,
        comments: true
      }
    }
  }
})
```

### 6. 性能监控实现

#### 6.1 API 性能中间件
```typescript
// src/middleware/performance.ts
export function withPerformanceLogging(handler: Function) {
  return async (req: any, ...args: any[]) => {
    const start = Date.now()
    const method = req.method
    const url = req.url
    
    try {
      const result = await handler(req, ...args)
      const duration = Date.now() - start
      
      console.log(`[API] ${method} ${url} - ${duration}ms`)
      
      // 慢查询警告
      if (duration > 1000) {
        console.warn(`[SLOW API] ${method} ${url} - ${duration}ms`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`[API ERROR] ${method} ${url} - ${duration}ms`, error)
      throw error
    }
  }
}
```

#### 6.2 数据库查询监控
```typescript
// src/db/client.ts - 添加查询日志
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event', 
      level: 'error',
    },
  ],
})

prisma.$on('query', (e) => {
  if (e.duration > 100) { // 慢查询阈值 100ms
    console.warn(`[SLOW QUERY] ${e.duration}ms - ${e.query}`)
  }
})
```

### 7. 响应压缩与优化

#### 7.1 gzip 压缩
```typescript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300'
          }
        ]
      }
    ]
  }
}
```

#### 7.2 API 响应优化
```typescript
// src/api/http.ts - 优化版本
export function ok(data: any, options: { status?: number, headers?: Record<string, string> } = {}) {
  const response = Response.json(data, {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      ...options.headers
    }
  })
  
  return response
}
```

---

## 📊 实施计划与效果预期

### 阶段1：立即实施 (1-2小时)
- ✅ 内存缓存实现
- ✅ API路由优化
- ✅ 性能监控添加

**预期效果：响应时间从 2000ms → 500ms**

### 阶段2：中期优化 (1-2天)
- ✅ 数据库索引添加
- ✅ Prisma连接池配置
- ✅ 会话缓存优化

**预期效果：响应时间从 500ms → 200ms**

### 阶段3：长期优化 (1周)
- ✅ 升级到 PostgreSQL
- ✅ Redis 缓存部署
- ✅ CDN 集成

**预期效果：响应时间从 200ms → 50-100ms**

---

## 🚀 快速实施指南

### 立即可用的快速修复

1. **添加内存缓存** (5分钟)
2. **优化API查询** (10分钟)  
3. **添加性能监控** (10分钟)

### 环境变量配置
```bash
# .env 添加
REDIS_URL=redis://localhost:6379
DATABASE_CONNECTION_LIMIT=10
CACHE_TTL_SITE_CONFIG=1800  # 30分钟
CACHE_TTL_USER_PROFILE=300  # 5分钟
ENABLE_QUERY_LOGGING=true
```

### 验证优化效果
```bash
# 测试API性能
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/me"
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/site-config"

# curl-format.txt 内容:
#   time_namelookup:  %{time_namelookup}\n
#   time_connect:     %{time_connect}\n
#   time_total:       %{time_total}\n
```

---

## 💡 额外优化建议

### 数据库优化
- 定期执行 `VACUUM` 清理 (SQLite)
- 启用 WAL 模式提升并发性
- 考虑读写分离架构

### 应用架构优化  
- 实现 API 限流
- 添加健康检查端点
- 使用 HTTP/2 Server Push

### 前端优化
- 实现 SWR 数据获取
- 添加 Loading 状态管理
- 使用 React Query 缓存

---

**🎯 目标：API响应时间从 2000ms+ 优化到 <200ms**

实施这些优化后，系统性能将显著提升，用户体验大幅改善！
