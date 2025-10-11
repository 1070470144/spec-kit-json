import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, badRequest, unauthorized, forbidden } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'
import { getCachedData, CACHE_CONFIG } from '@/src/cache/api-cache'

// OPTIONS 请求处理（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  let { id } = await context.params
  
  // 检查是否请求 .json 格式（通过URL路径判断）
  const url = new URL(req.url)
  const isJsonFormat = url.pathname.endsWith('.json')
  
  // 移除 .json 后缀（如果存在）
  id = id.replace(/\.json$/, '')
  
  try {
    const scriptData = await getCachedData(
      CACHE_CONFIG.SCRIPT_DETAIL(id),
      async () => {
        console.log(`[DB QUERY] script-detail-${id}-query`)
        const queryStartTime = Date.now()
        
        const s = await prisma.script.findUnique({
          where: { id },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            versions: { orderBy: { createdAt: 'desc' }, take: 1 },
            author: { select: { nickname: true, email: true } }
          }
        })
        
        const queryDuration = Date.now() - queryStartTime
        if (queryDuration > 150) {
          console.warn(`[SLOW QUERY] script-detail-${id} - ${queryDuration}ms`)
        }
        
        if (!s) return null
        
        const images = s.images.map(i => ({ 
          id: i.id, 
          url: `/api/files?path=${encodeURIComponent(i.path)}`, 
          isCover: i.isCover 
        }))
        
        let json: unknown = null
        try { 
          json = s.versions[0] ? JSON.parse(s.versions[0].content) : null 
        } catch { 
          json = null 
        }
        
        const author = s.authorName || s.author?.nickname || s.author?.email || null
        
        return { 
          id: s.id, 
          title: s.title, 
          author, 
          state: s.state, 
          images, 
          json 
        }
      }
    )
    
    if (!scriptData) {
      const duration = Date.now() - startTime
      console.log(`[API] GET /api/scripts/${id} - ${duration}ms (not found)`)
      return notFound()
    }
    
    const duration = Date.now() - startTime
    console.log(`[API] GET /api/scripts/${id} - ${duration}ms`)
    
    // 如果请求的是 .json 格式，返回格式化的纯JSON
    if (isJsonFormat && scriptData.json) {
      const jsonString = JSON.stringify(scriptData.json, null, 2)
      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'inline; filename*=UTF-8\'\'custom-script.json',
          // CORS 头 - 允许血染钟楼官网访问
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
    
    return ok(scriptData)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] GET /api/scripts/${id} - ${duration}ms:`, error)
    return notFound()
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  let { id } = await context.params
  // 移除 .json 后缀（如果存在）
  id = id.replace(/\.json$/, '')
  const body = await req.json().catch(()=>null)
  if (!body || typeof body !== 'object') return badRequest('INVALID_JSON')
  const { title, authorName, json } = body as { title?: string; authorName?: string | null; json?: unknown }
  const s = await prisma.script.findUnique({ where: { id }, select: { id: true } })
  if (!s) return notFound()

  // 更新基础信息
  if (typeof title === 'string' || typeof authorName === 'string' || authorName === null) {
    await prisma.script.update({ where: { id }, data: { title: typeof title === 'string' ? title : undefined, authorName: authorName === undefined ? undefined : authorName } })
  }
  // 新增新版本 JSON（如提供）
  if (json !== undefined) {
    const contentStr = JSON.stringify(json)
    const hash = (await import('node:crypto')).createHash('sha256').update(contentStr).digest('hex')
    await prisma.scriptJSON.create({ data: { scriptId: id, content: contentStr, contentHash: hash, schemaValid: true, version: 1 } })
  }
  return ok({ id })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  let { id } = await context.params
  // 移除 .json 后缀（如果存在）
  id = id.replace(/\.json$/, '')

  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const exist = await prisma.script.findUnique({ where: { id }, select: { id: true } })
  if (!exist) return notFound()
  // 事务删除关联资源
  await prisma.$transaction(async (tx) => {
    await tx.imageAsset.deleteMany({ where: { scriptId: id } })
    await tx.scriptJSON.deleteMany({ where: { scriptId: id } })
    await tx.review.deleteMany({ where: { scriptId: id } })
    await tx.downloadEvent.deleteMany({ where: { scriptId: id } })
    await tx.script.delete({ where: { id } })
  })
  return ok({ id })
}
