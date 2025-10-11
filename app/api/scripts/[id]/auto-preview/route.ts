import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { notFound, internalError } from '@/src/api/http'
import { generateScriptPreview, getPreviewImagePath } from '@/src/generators/script-preview'
import { LocalStorage } from '@/src/storage/local'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  const { id } = await context.params
  
  try {
    const storage = new LocalStorage()
    const imagePath = getPreviewImagePath(id)
    const fullPath = storage.getAbsolutePath(imagePath)
    
    // 检查是否已有生成的预览图
    if (existsSync(fullPath)) {
      console.log(`[AUTO PREVIEW] Serving existing preview for ${id}`)
      
      // 读取并返回SVG文件
      const fs = require('fs')
      const svgContent = fs.readFileSync(fullPath, 'utf-8')
      
      return new Response(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400', // 缓存24小时
        }
      })
    }
    
    // 如果不存在，实时生成
    console.log(`[AUTO PREVIEW] Generating preview for script ${id}`)
    
    // 获取剧本数据
    const script = await prisma.script.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        authorName: true,
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
      console.log(`[AUTO PREVIEW] Script not found - ${duration}ms`)
      return notFound()
    }
    
    // 解析JSON数据
    let json: any = {}
    try {
      if (script.versions[0]?.content) {
        json = JSON.parse(script.versions[0].content)
      }
    } catch (error) {
      console.warn(`[AUTO PREVIEW] Failed to parse JSON for script ${id}:`, error)
    }
    
    // 准备脚本数据
    const scriptData = {
      id: script.id,
      title: script.title,
      author: script.authorName || script.author?.nickname || script.author?.email,
      json
    }
    
    // 生成SVG预览图
    const genStartTime = Date.now()
    const imageBuffer = await generateScriptPreview(scriptData, fullPath)
    const genDuration = Date.now() - genStartTime
    
    console.log(`[AUTO PREVIEW] Generated in ${genDuration}ms for "${script.title}"`)
    
    // 异步保存到数据库
    setImmediate(async () => {
      try {
        // 检查是否已存在记录
        const existing = await prisma.imageAsset.findFirst({
          where: {
            scriptId: id,
            path: imagePath
          }
        })
        
        if (!existing) {
          await prisma.imageAsset.create({
            data: {
              scriptId: id,
              path: imagePath,
              mime: 'image/svg+xml',
              size: 0,
              sha256: '',
              isCover: true,
              sortOrder: -1, // 自动生成优先级低
            }
          })
        }
        console.log(`[AUTO PREVIEW] Database updated for ${id}`)
      } catch (error) {
        console.warn(`[AUTO PREVIEW] Database update failed for ${id}:`, error)
      }
    })
    
    const totalDuration = Date.now() - startTime
    console.log(`[API] GET /api/scripts/${id}/auto-preview - ${totalDuration}ms`)
    
    // 返回生成的SVG
    return new Response(imageBuffer.toString('utf-8'), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
      }
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] GET /api/scripts/${id}/auto-preview - ${duration}ms:`, error)
    return internalError('AUTO_PREVIEW_FAILED')
  }
}
