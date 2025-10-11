import { NextRequest } from 'next/server'
import { ok, badRequest, internalError } from '@/src/api/http'
import { generateScriptPreviewSVG } from '@/src/generators/script-preview'

// 下载图片并转为base64
async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000) // 5秒超时
    })
    if (!response.ok) return null
    
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/png'
    
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.warn(`[PREVIEW] Failed to download image: ${url}`, error)
    return null
  }
}

// 处理JSON，将图片URL转为base64
async function processImagesInJson(json: any): Promise<any> {
  if (Array.isArray(json)) {
    const processed = await Promise.all(
      json.map(async (item) => {
        if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
          const base64 = await downloadImageAsBase64(item.image)
          return { ...item, image: base64 || item.image }
        }
        return item
      })
    )
    return processed
  }
  return json
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await req.json().catch(() => null)
    
    if (!body || !body.title) {
      return badRequest('Missing required fields: title')
    }
    
    const { id, title, author, json } = body
    
    console.log(`[TEMP PREVIEW] Generating preview for "${title}"`)
    const genStartTime = Date.now()
    
    // 处理图片URL为base64
    const processedJson = await processImagesInJson(json)
    
    // 使用预览图生成器创建SVG
    const scriptData = {
      id: id || 'temp',
      title,
      author: author || '未知作者', 
      json: processedJson
    }
    
    const svg = generateScriptPreviewSVG(scriptData)
    const genDuration = Date.now() - genStartTime
    
    const totalDuration = Date.now() - startTime
    console.log(`[API] POST /api/scripts/temp-preview/generate - ${totalDuration}ms (gen: ${genDuration}ms)`)
    
    // 直接返回SVG内容，设置正确的Content-Type
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache', // 临时预览不缓存
      }
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] POST /api/scripts/temp-preview/generate - ${duration}ms:`, error)
    return internalError('TEMP_PREVIEW_FAILED')
  }
}

