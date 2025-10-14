import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, internalError } from '@/src/api/http'
import { generateScriptPreview, getPreviewImagePath } from '@/src/generators/script-preview'
import { LocalStorage } from '@/src/storage/local'
import { getAdminSession } from '@/src/auth/adminSession'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 验证管理员权限
    const admin = await getAdminSession()
    if (!admin) {
      return unauthorized('NOT_ADMIN')
    }

    console.log('[REFRESH PREVIEWS] Starting batch preview refresh for published scripts...')

    // 获取所有已发布的剧本（审核通过）
    const scripts = await prisma.script.findMany({
      where: {
        state: 'published'
      },
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

    console.log(`[REFRESH PREVIEWS] Found ${scripts.length} published scripts`)

    const results = {
      total: scripts.length,
      success: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ id: string; title: string; status: 'success' | 'skipped' | 'failed'; reason?: string }>
    }

    const storage = new LocalStorage()

    // 遍历所有剧本
    for (const script of scripts) {
      try {
        // 检查是否有玩家上传的预览图
        const hasUserUploadedImage = script.images.some(img => 
          img.isCover && img.sortOrder !== -1
        )

        if (hasUserUploadedImage) {
          // 有玩家上传的图片，跳过
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

        // 解析JSON数据
        let json: any = {}
        try {
          if (script.versions[0]?.content) {
            json = JSON.parse(script.versions[0].content)
          }
        } catch (error) {
          results.failed++
          results.details.push({
            id: script.id,
            title: script.title,
            status: 'failed',
            reason: 'JSON解析失败'
          })
          console.error(`[REFRESH PREVIEWS] Failed to parse JSON for ${script.title}:`, error)
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
    console.log(`[REFRESH PREVIEWS] Completed in ${duration}ms - Success: ${results.success}, Skipped: ${results.skipped}, Failed: ${results.failed}`)

    return ok({
      message: '预览图刷新完成',
      results
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] POST /api/admin/scripts/refresh-all-previews - ${duration}ms:`, error)
    return internalError('REFRESH_PREVIEWS_FAILED')
  }
}

