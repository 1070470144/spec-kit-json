import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, internalError, badRequest } from '@/src/api/http'
import { generateScriptPreview, getPreviewImagePath } from '@/src/generators/script-preview'
import { LocalStorage } from '@/src/storage/local'
import { getAdminSession } from '@/src/auth/adminSession'

// 批处理大小 - 极小批次避免 QUIC 空闲超时
const BATCH_SIZE = 2

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  // 在 try 块外部声明变量，以便在 catch 块中使用
  let page = 0
  let batchSize = BATCH_SIZE
  
  try {
    // 验证管理员权限
    const admin = await getAdminSession()
    if (!admin) {
      return unauthorized('NOT_ADMIN')
    }

    // 解析请求参数
    const body = await req.json().catch(() => ({}))
    const parsedParams = { 
      page: body.page ?? 0, 
      batchSize: body.batchSize ?? BATCH_SIZE,
      forceRefresh: body.forceRefresh ?? false 
    }
    
    page = parsedParams.page
    batchSize = parsedParams.batchSize
    const forceRefresh = parsedParams.forceRefresh

    const skip = page * batchSize
    
    console.log(`[REFRESH PREVIEWS] Starting batch ${page + 1} (skip: ${skip}, take: ${batchSize})`)

    // 获取总数量
    const totalCount = await prisma.script.count({
      where: {
        state: 'published'
      }
    })

    // 获取当前批次的已发布剧本
    const scripts = await prisma.script.findMany({
      where: {
        state: 'published'
      },
      skip,
      take: batchSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        authorName: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true }
        },
        author: {
          select: { nickname: true, email: true }
        },
        images: {
          select: {
            id: true,
            path: true,
            sortOrder: true,
            isCover: true
          }
        }
      }
    })

    console.log(`[REFRESH PREVIEWS] Processing batch ${page + 1}: ${scripts.length} scripts`)

    const results = {
      page,
      batchSize,
      total: totalCount,
      processed: scripts.length,
      hasMore: skip + scripts.length < totalCount,
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ id: string; title: string; status: 'success' | 'skipped' | 'failed'; reason?: string }>
    }

    const storage = new LocalStorage()

    // 遍历当前批次的剧本
    for (const script of scripts) {
      try {
        // 检查是否有玩家上传的预览图
        const hasUserUploadedImage = script.images.some(img => 
          img.isCover && img.sortOrder !== -1
        )

        if (hasUserUploadedImage && !forceRefresh) {
          // 有玩家上传的图片，跳过（除非强制刷新）
          results.skipped++
          results.details.push({
            id: script.id,
            title: script.title,
            status: 'skipped',
            reason: '已有玩家上传的预览图'
          })
          console.log(`[REFRESH PREVIEWS] Skipped ${script.title} - has user uploaded image`)
          continue
        }

        // 解析JSON数据，增强错误处理
        let json: any = {}
        let jsonParseError: string | null = null
        
        try {
          if (script.versions[0]?.content) {
            const content = script.versions[0].content.trim()
            if (!content) {
              throw new Error('内容为空')
            }
            
            // 检查是否是有效的JSON格式
            if (!content.startsWith('{') && !content.startsWith('[')) {
              throw new Error('不是有效的JSON格式')
            }
            
            json = JSON.parse(content)
            
            // 基本验证JSON结构
            if (!json || (typeof json !== 'object')) {
              throw new Error('JSON结构无效')
            }
            
          } else {
            throw new Error('没有版本内容')
          }
        } catch (error) {
          jsonParseError = error instanceof Error ? error.message : '未知JSON错误'
          results.failed++
          results.details.push({
            id: script.id,
            title: script.title,
            status: 'failed',
            reason: `JSON解析失败: ${jsonParseError}`
          })
          console.error(`[REFRESH PREVIEWS] Failed to parse JSON for ${script.title}:`, jsonParseError)
          continue
        }

        // 准备脚本数据
        const scriptData = {
          id: script.id,
          title: script.title,
          author: script.authorName || script.author?.nickname || script.author?.email || '未知作者',
          json
        }

        // 生成预览图
        const imagePath = getPreviewImagePath(script.id)
        const fullPath = storage.getAbsolutePath(imagePath)

        await generateScriptPreview(scriptData, fullPath)

        // 检查是否已有自动生成的图片记录
        const existingAutoImage = script.images.find(img => img.sortOrder === -1 && img.isCover)

        if (!existingAutoImage) {
          // 如果没有自动生成的图片记录，创建一个
          await prisma.imageAsset.create({
            data: {
              scriptId: script.id,
              path: imagePath,
              mime: 'image/svg+xml',
              size: 0,
              sha256: '',
              isCover: true,
              sortOrder: -1,
            }
          })
        }

        results.success++
        results.details.push({
          id: script.id,
          title: script.title,
          status: 'success'
        })
        console.log(`[REFRESH PREVIEWS] Successfully refreshed preview for ${script.title}`)

      } catch (error) {
        results.failed++
        results.details.push({
          id: script.id,
          title: script.title,
          status: 'failed',
          reason: error instanceof Error ? error.message : '未知错误'
        })
        console.error(`[REFRESH PREVIEWS] Failed to refresh preview for ${script.title}:`, error)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[REFRESH PREVIEWS] Batch ${page + 1} completed in ${duration}ms - Success: ${results.success}, Skipped: ${results.skipped}, Failed: ${results.failed}`)

    // 计算总体进度
    const processedSoFar = skip + results.processed
    const progressPercentage = totalCount > 0 ? Math.round((processedSoFar / totalCount) * 100) : 100

    return ok({
      message: results.hasMore ? 
        `批次 ${page + 1} 完成，共 ${Math.ceil(totalCount / batchSize)} 批次` : 
        '所有批次处理完成',
      batch: results,
      progress: {
        current: processedSoFar,
        total: totalCount,
        percentage: progressPercentage,
        hasMore: results.hasMore,
        nextPage: results.hasMore ? page + 1 : null
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] POST /api/admin/scripts/refresh-all-previews - ${duration}ms:`, error)
    return internalError('REFRESH_PREVIEWS_FAILED', {
      message: error instanceof Error ? error.message : '批处理失败',
      page,
      batchSize
    })
  }
}

