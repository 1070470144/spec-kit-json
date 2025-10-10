import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok } from '@/src/api/http'
import { getCachedData, CACHE_CONFIG } from '@/src/cache/api-cache'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    const tp = searchParams.get('type')
    const type = tp === 'favorites' ? 'favorites' : tp === 'downloads' ? 'downloads' : 'likes'
    
    // 使用缓存
    const data = await getCachedData(
      { ...CACHE_CONFIG.LEADERBOARD(type), key: `leaderboard-${type}` },
      async () => {
        console.log(`[DB QUERY] leaderboard-${type}-query`)
        const queryStartTime = Date.now()
        
        const order = type === 'likes' 
          ? { likes: { _count: 'desc' } } 
          : type === 'favorites' 
          ? { favorites: { _count: 'desc' } } 
          : { downloads: { _count: 'desc' } }
          
        const selectCount = type === 'likes' 
          ? { likes: true } 
          : type === 'favorites' 
          ? { favorites: true } 
          : { downloads: true }
          
        const items = await prisma.script.findMany({
          where: { state: 'published' },
          orderBy: order as any,
          take: 50,
          select: { 
            id: true, 
            title: true, 
            authorName: true, 
            _count: { select: selectCount } 
          }
        })
        
        const queryDuration = Date.now() - queryStartTime
        if (queryDuration > 100) {
          console.warn(`[SLOW QUERY] leaderboard-${type} - ${queryDuration}ms`)
        }
        
        const list = items.map(s => ({ 
          id: s.id, 
          title: s.title, 
          authorName: s.authorName, 
          count: type === 'likes' 
            ? (s._count as any).likes 
            : type === 'favorites' 
            ? (s._count as any).favorites 
            : (s._count as any).downloads 
        }))
        
        return { [type]: list }
      }
    )
    
    const duration = Date.now() - startTime
    console.log(`[API] GET /api/leaderboard - ${duration}ms`)
    
    return ok(data)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] GET /api/leaderboard - ${duration}ms:`, error)
    return ok({ likes: [], favorites: [], downloads: [] })
  }
}


