import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { z } from 'zod'
import { ok, unsupportedMediaType, badRequest, tooLarge, internalError, forbidden, unauthorized } from '@/src/api/http'
import { parseJson } from '@/src/api/validate'
import { LocalStorage } from '@/src/storage/local'
import { getSession } from '@/src/auth/session'
import { getAdminSession } from '@/src/auth/adminSession'
import { getCachedData, CACHE_CONFIG, invalidateCache } from '@/src/cache/api-cache'
import { revalidatePath } from 'next/cache'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state') || undefined
  const q = searchParams.get('q') || undefined
  const mine = searchParams.get('mine') === '1'
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || '20')))
  const skip = (page - 1) * pageSize

  const where: any = {}
  const effectiveState = state ?? (mine ? undefined : 'published')
  if (effectiveState && effectiveState !== 'published' && !mine) {
    const admin = await getAdminSession()
    if (!admin) return forbidden('NOT_ADMIN')
  }
  if (effectiveState) where.state = effectiveState
  if (q) where.title = { contains: q }
  if (mine) {
    const s = await getSession()
    if (!s) {
      console.log('[List] Mine mode but no session')
      return ok({ items: [], total: 0, page, pageSize })
    }
    where.createdById = s.userId
    console.log('[List] Mine mode - userId:', s.userId, 'Where:', JSON.stringify(where))
  }

  // 构建缓存键，包含主要查询参数
  const cacheKey = `scripts-${effectiveState || 'all'}-${q || 'noquery'}-${mine ? 'mine' : 'public'}-${page}-${pageSize}${mine ? `-${JSON.stringify(where)}` : ''}`
  
  // 对于非个人查询使用缓存
  const shouldCache = !mine && !q // 公共列表和无搜索条件时使用缓存
  
  let itemsRaw, total
  
  if (shouldCache) {
    const cachedData = await getCachedData(
      { ...CACHE_CONFIG.SCRIPTS_LIST('list'), key: cacheKey },
      async () => {
        console.log(`[DB QUERY] scripts-list-query - state:${effectiveState}, page:${page}`)
        const queryStartTime = Date.now()
        
        const [items, count] = await Promise.all([
          prisma.script.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            select: { 
              id: true, 
              title: true, 
              authorName: true, 
              language: true, 
              state: true, 
              createdAt: true, 
              images: { 
                select: { path: true, isCover: true, sortOrder: true }, 
                take: 1, 
                orderBy: { sortOrder: 'asc' } 
              } 
            }
          }),
          prisma.script.count({ where })
        ])
        
        const queryDuration = Date.now() - queryStartTime
        if (queryDuration > 200) {
          console.warn(`[SLOW QUERY] scripts-list - ${queryDuration}ms`)
        }
        
        return { items, total: count }
      }
    )
    
    itemsRaw = cachedData.items
    total = cachedData.total
  } else {
    // 个人查询或搜索不使用缓存
    console.log(`[DB QUERY] scripts-list-query (no-cache) - mine:${mine}, q:${q}`)
    const queryStartTime = Date.now()
    
    const [items, count] = await Promise.all([
      prisma.script.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: { 
          id: true, 
          title: true, 
          authorName: true, 
          language: true, 
          state: true, 
          createdAt: true, 
          images: { 
            select: { path: true, isCover: true, sortOrder: true }, 
            take: 1, 
            orderBy: { sortOrder: 'asc' } 
          } 
        }
      }),
      prisma.script.count({ where })
    ])
    
    const queryDuration = Date.now() - queryStartTime
    if (queryDuration > 200) {
      console.warn(`[SLOW QUERY] scripts-list (no-cache) - ${queryDuration}ms`)
    }
    
    itemsRaw = items
    total = count
  }

  // 处理剧本预览图URL（只使用用户上传的图片）
  const items = await Promise.all(itemsRaw.map(async (it) => {
    let previewUrl = null
    
    // 只使用用户上传的图片，不自动生成
    if (it.images && it.images[0]?.path) {
      previewUrl = `/api/files?path=${encodeURIComponent(it.images[0].path)}`
    }
    // 没有用户上传图片时，previewUrl 保持为 null
    
    return {
      ...it,
      previewUrl,
      hasAutoPreview: false // 不再自动生成预览图
    }
  }))
  
  console.log('[List] Returning:', items.length, 'items, Total:', total, 'Mine:', mine)

  const duration = Date.now() - startTime
  console.log(`[API] GET /api/scripts - ${duration}ms (cached: ${shouldCache})`)
  
  return ok({ items, total, page, pageSize })
}

// 标题改为可选，由后续从JSON中提取
const createSchema = z.object({ title: z.string().optional().default(''), json: z.any() })
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/svg+xml'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_IMAGES = 3
const MAX_JSON_SIZE = 5 * 1024 * 1024

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    try {
      const form = await req.formData()
      const title = String(form.get('title') || '')
      const authorName = form.get('authorName') ? String(form.get('authorName')) : null
      const jsonFile = form.get('jsonFile') as File | null
      const images = form.getAll('images') as (File | null)[]

      // 仅要求JSON文件，标题可选
      if (!jsonFile) return badRequest('jsonFile is required')
      if (jsonFile.size > MAX_JSON_SIZE) return tooLarge('JSON file too large')

      const jsonText = await jsonFile.text()
      let json: unknown
      try {
        json = JSON.parse(jsonText)
      } catch (e) {
        return badRequest('Invalid JSON file')
      }

      if (images.length > MAX_IMAGES) return badRequest('Too many images (max 3)')

      const storage = new LocalStorage()
      const contentStr = JSON.stringify(json)
      const hash = (await import('node:crypto')).createHash('sha256').update(contentStr).digest('hex')
      
      // 只使用当前登录用户的会话（管理员也是用户）
      const userSession = await getSession()
      if (!userSession) {
        return unauthorized('NOT_LOGGED_IN')
      }
      const ownerId = userSession.userId
      
      console.log('[Upload] User userId:', userSession.userId, 'ownerId:', ownerId)

      // 从JSON中提取标题和作者（如果用户没填）
      let finalTitle = title
      let finalAuthorName = authorName
      
      if (!finalTitle || !finalAuthorName) {
        const jsonData = json as any
        const jsonTitle = Array.isArray(jsonData)
          ? (jsonData[0]?.name || jsonData[0]?.id || '')
          : (jsonData?.name || jsonData?.id || '')
        const jsonAuthor = Array.isArray(jsonData)
          ? (jsonData[0]?.author || '')
          : (jsonData?.author || '')
        
        if (!finalTitle) finalTitle = jsonTitle || '未命名剧本'
        if (!finalAuthorName) finalAuthorName = jsonAuthor || ''
        
        console.log('[Upload] Extracted from JSON - title:', finalTitle, 'author:', finalAuthorName)
      }

      // 不再按标题合并系列：始终创建新剧本
      const created = await prisma.script.create({
        data: {
          title: finalTitle,
          authorName: finalAuthorName || undefined,
          state: 'pending',
          createdById: ownerId,
          versions: {
            create: {
              content: contentStr,
              contentHash: hash,
              schemaValid: true,
              version: 1,
              createdById: ownerId
            }
          }
        },
        select: { id: true }
      })
      const scriptId = created.id
      
      console.log('[Upload] Created script:', scriptId, 'for user:', ownerId)

      let sortOrder = 0
      for (const f of images) {
        if (!f) continue
        if (!ALLOWED.has(f.type)) return unsupportedMediaType('IMAGE_TYPE_NOT_ALLOWED')
        const buf = Buffer.from(await f.arrayBuffer())
        if (buf.byteLength > MAX_IMAGE_SIZE) return tooLarge('FILE_TOO_LARGE')
        const meta = await storage.save(buf, f.name || 'image', f.type || 'application/octet-stream')
        
        // 检查是否为前端上传的自动预览图（文件名以 "preview-" 开头的 SVG）
        const isAutoPreview = f.name?.startsWith('preview-') && f.type === 'image/svg+xml'
        
        await prisma.imageAsset.create({
          data: {
            scriptId,
            path: meta.path,
            mime: meta.mime,
            size: meta.size,
            sha256: meta.sha256 || '',
            sortOrder: isAutoPreview ? -1 : sortOrder++, // 自动预览图优先级低
            isCover: isAutoPreview // 自动预览图标记为封面
          }
        })
      }

      // 异步生成预览图（如果没有用户上传图片）
      if (images.filter(f => f).length === 0) {
        setImmediate(async () => {
          try {
            console.log(`[UPLOAD] Auto-generating preview for new script: ${finalTitle}`)
            
            const { generateScriptPreview, getPreviewImagePath } = await import('@/src/generators/script-preview')
            
            const scriptData = {
              id: scriptId,
              title: finalTitle,
              author: finalAuthorName || '未知作者',
              json: json || {}
            }
            
            const imagePath = getPreviewImagePath(scriptId)
            const fullPath = storage.getAbsolutePath(imagePath)
            
            await generateScriptPreview(scriptData, fullPath)
            
            // 保存到数据库
            await prisma.imageAsset.create({
              data: {
                scriptId: scriptId,
                path: imagePath,
                mime: 'image/svg+xml',
                size: 0,
                sha256: '',
                isCover: true,
                sortOrder: -1, // 自动生成优先级低
              }
            })
            
            console.log(`[UPLOAD] Auto preview generated for ${scriptId}`)
            
          } catch (error) {
            console.error(`[UPLOAD] Failed to generate preview for ${scriptId}:`, error)
          }
        })
      }
      
      // 清除待审核列表缓存
      invalidateCache('scripts-pending')
      invalidateCache('scripts-all')
      
      // 刷新服务端渲染页面缓存
      revalidatePath('/admin/review')
      revalidatePath('/admin/scripts')
      revalidatePath('/my/uploads')
      
      console.log(`[UPLOAD] Script ${scriptId} created (form), cache invalidated`)
      
      return ok({ 
        id: scriptId,
        hasAutoPreview: false // 不再自动生成预览图
      }, 201)
    } catch (e: any) {
      if (e?.code === 'P2002' && String(e?.meta?.target || '').includes('contentHash')) {
        return badRequest('DUPLICATE_JSON')
      }
      return internalError('UPLOAD_FAILED', e?.message)
    }
  }

  if (!contentType.includes('application/json')) {
    return unsupportedMediaType()
  }
  const parsed = await parseJson(req, createSchema)
  if (!parsed.ok) return parsed.res
  const { title, json } = parsed.data

  if (typeof json !== 'object') {
    return badRequest('json must be object')
  }

  const contentStr = JSON.stringify(json)
  const hash = (await import('node:crypto')).createHash('sha256').update(contentStr).digest('hex')
  
  // 只使用当前登录用户的会话（管理员也是用户）
  const userSession = await getSession()
  if (!userSession) {
    return unauthorized('NOT_LOGGED_IN')
  }
  const ownerId = userSession.userId
  try {
    // 如果未提供标题，则从JSON中提取
    let finalTitle = title
    if (!finalTitle) {
      const jsonData = json as any
      let jsonTitle = ''
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        const meta = jsonData.find((it: any) => it?.id === '_meta')
        if (meta) {
          jsonTitle = meta.name || meta.id || ''
        } else {
          const firstItem = jsonData.find((it: any) => it && it.id !== '_meta')
          jsonTitle = firstItem?.name || firstItem?.id || ''
        }
      } else if (jsonData && typeof jsonData === 'object') {
        jsonTitle = jsonData.name || jsonData.id || ''
      }
      finalTitle = jsonTitle || '未命名剧本'
    }
    const created = await prisma.script.create({
      data: {
        title: finalTitle,
        state: 'pending',
        createdById: ownerId,
        versions: {
          create: {
            content: contentStr,
            contentHash: hash,
            schemaValid: true,
            version: 1,
            createdById: ownerId
          }
        }
      },
      select: { id: true }
    })
    
    // 清除待审核列表缓存
    invalidateCache('scripts-pending')
    invalidateCache('scripts-all')
    
    // 刷新服务端渲染页面缓存
    revalidatePath('/admin/review')
    revalidatePath('/admin/scripts')
    revalidatePath('/my/uploads')
    
    console.log(`[UPLOAD] Script ${created.id} created (JSON), cache invalidated`)
    
    return ok({ id: created.id }, 201)
  } catch (e: any) {
    if (e?.code === 'P2002' && String(e?.meta?.target || '').includes('contentHash')) {
      return badRequest('DUPLICATE_JSON')
    }
    return internalError('UPLOAD_FAILED', e?.message)
  }
}
