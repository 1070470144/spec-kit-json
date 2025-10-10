import { PrismaClient } from '@prisma/client'
import { perfStats } from '@/src/utils/performance'

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient;
  prismaConnected?: boolean;
}

// 创建优化的Prisma客户端
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      }
    ] : ['error'],
    
    // 连接配置优化
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // 查询性能监控
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      const duration = e.duration
      perfStats.record('db-query', duration)
      
      if (duration > 100) {
        console.warn(`[SLOW QUERY] ${duration}ms - ${e.query.substring(0, 100)}...`)
        console.warn(`[SLOW QUERY PARAMS]`, e.params)
      }
    })

    client.$on('error', (e) => {
      console.error('[DB ERROR]', e)
    })
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 开发环境缓存客户端
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 连接状态管理
export async function ensureConnection(): Promise<void> {
  if (globalForPrisma.prismaConnected) {
    return
  }

  try {
    await prisma.$connect()
    globalForPrisma.prismaConnected = true
    console.log('[DB] Connected successfully')
  } catch (error) {
    console.error('[DB] Connection failed:', error)
    throw error
  }
}

// 优雅关闭
async function gracefulShutdown() {
  console.log('[DB] Disconnecting...')
  await prisma.$disconnect()
  globalForPrisma.prismaConnected = false
}

// 监听进程退出 (仅在服务器端)
if (typeof window === 'undefined') {
  process.on('beforeExit', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
}

// 数据库健康检查
export async function checkDatabaseHealth(): Promise<{ status: string; latency: number }> {
  const start = Date.now()
  
  try {
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    
    return {
      status: 'healthy',
      latency
    }
  } catch (error) {
    console.error('[DB HEALTH] Check failed:', error)
    return {
      status: 'unhealthy',
      latency: Date.now() - start
    }
  }
}
