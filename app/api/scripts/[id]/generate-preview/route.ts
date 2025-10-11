import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, internalError } from '@/src/api/http'
import { generateScriptPreview, getPreviewImagePath } from '@/src/generators/script-preview'
import { LocalStorage } from '@/src/storage/local'
import { join } from 'path'

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  const { id } = await context.params
  
  try {
    console.log(`[PREVIEW GEN] Starting preview generation for script ${id}`)
    
    // 获取剧本数据
    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        versions: { 
          orderBy: { createdAt: 'desc' }, 
          take: 1,
          select: { content: true }
        },
        author: { select: { nickname: true, email: true } }
      }
    })
    
    if (!script) {
      const duration = Date.now() - startTime
      console.log(`[PREVIEW GEN] Script not found - ${duration}ms`)
      return notFound()
    }
    
    // 解析JSON数据
    let json: any = {}
    try {
      if (script.versions[0]?.content) {
        json = JSON.parse(script.versions[0].content)
      }
    } catch (error) {
      console.warn(`[PREVIEW GEN] Failed to parse JSON for script ${id}:`, error)
    }
    
    // 准备脚本数据
    const scriptData = {
      id: script.id,
      title: script.title,
      author: script.authorName || script.author?.nickname || script.author?.email,
      json
    }
    
    // 生成预览图
    console.log(`[PREVIEW GEN] Generating image for "${script.title}"`)
    const genStartTime = Date.now()
    
    const imageBuffer = await generateScriptPreview(scriptData)
    const genDuration = Date.now() - genStartTime
    
    // 保存到存储
    const storage = new LocalStorage()
    const imagePath = getPreviewImagePath(id)
    const fullPath = await storage.put(imagePath, imageBuffer, 'image/svg+xml')
    
    console.log(`[PREVIEW GEN] Image generated in ${genDuration}ms, saved to: ${imagePath}`)
    
    // 创建数据库记录（如果不存在）
    try {
      // 检查是否已存在记录
      const existing = await prisma.imageAsset.findFirst({
        where: {
          scriptId: id,
          path: fullPath
        }
      })
      
      if (!existing) {
        await prisma.imageAsset.create({
          data: {
            scriptId: id,
            path: fullPath,
            mime: 'image/svg+xml',
            size: imageBuffer.length,
            sha256: '',
            isCover: true,
            sortOrder: -1, // 自动生成的图片优先级低于用户上传
          }
        })
      }
      console.log(`[PREVIEW GEN] Database record created/updated for ${id}`)
    } catch (dbError) {
      // 如果数据库操作失败，图片已生成，记录警告但不返回错误
      console.warn(`[PREVIEW GEN] Failed to save to database:`, dbError)
    }
    
    const totalDuration = Date.now() - startTime
    console.log(`[API] POST /api/scripts/${id}/generate-preview - ${totalDuration}ms`)
    
    return ok({
      success: true,
      imagePath,
      imageUrl: `/api/files?path=${encodeURIComponent(fullPath)}`,
      generationTime: genDuration,
      totalTime: totalDuration
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] POST /api/scripts/${id}/generate-preview - ${duration}ms:`, error)
    return internalError('PREVIEW_GENERATION_FAILED')
  }
}

// 获取预览图信息
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
  try {
    const storage = new LocalStorage()
    const imagePath = getPreviewImagePath(id)
    const fullPath = join(storage.basePath, imagePath)
    
    // 检查文件是否存在
    const fs = require('fs')
    const exists = fs.existsSync(fullPath)
    
    if (exists) {
      const stats = fs.statSync(fullPath)
      return ok({
        exists: true,
        imagePath,
        imageUrl: `/api/files?path=${encodeURIComponent(fullPath)}`,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      })
    } else {
      return ok({
        exists: false,
        imagePath,
        suggested_url: `/api/scripts/${id}/generate-preview`
      })
    }
  } catch (error) {
    console.error(`[API ERROR] GET /api/scripts/${id}/generate-preview:`, error)
    return internalError('PREVIEW_CHECK_FAILED')
  }
}
