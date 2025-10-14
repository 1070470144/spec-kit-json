import { NextRequest } from 'next/server'
import { ok, badRequest, internalError } from '@/src/api/http'
import { generateScriptPreviewSVG } from '@/src/generators/script-preview'
import sharp from 'sharp'

// 真实压缩图片到指定大小（降低分辨率）
async function compressImageToBase64(buffer: ArrayBuffer, contentType: string, maxSize: number = 30 * 1024): Promise<string | null> {
  try {
    console.log(`[COMPRESS] Processing image: ${buffer.byteLength} bytes → target: ${maxSize} bytes`)
    
    // 如果图片已经足够小，直接返回
    if (buffer.byteLength <= maxSize) {
      const base64 = Buffer.from(buffer).toString('base64')
      console.log(`[COMPRESS] ✓ Using original (${buffer.byteLength} bytes)`)
      return `data:${contentType};base64,${base64}`
    }
    
    // 首先尝试使用Canvas/简单压缩方法
    try {
      // 对于PNG/JPEG图片，尝试简单的quality压缩
      let quality = 70
      let maxWidth = 48
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const compressedBuffer = await sharp(Buffer.from(buffer))
            .resize(maxWidth, maxWidth, { fit: 'inside', withoutEnlargement: true })
            .png({ quality, compressionLevel: 9 }) // 使用PNG而不是JPEG
            .toBuffer()
          
          console.log(`[COMPRESS] PNG attempt ${attempt + 1}: ${maxWidth}px, quality ${quality} → ${compressedBuffer.length} bytes`)
          
          if (compressedBuffer.length <= maxSize) {
            const base64 = compressedBuffer.toString('base64')
            console.log(`[COMPRESS] ✓ PNG compressed successfully: ${buffer.byteLength} → ${compressedBuffer.length} bytes`)
            return `data:image/png;base64,${base64}`
          }
          
          // 调整参数
          maxWidth = Math.max(24, Math.floor(maxWidth * 0.8))
          quality = Math.max(30, quality - 20)
        } catch (sharpError) {
          console.log(`[COMPRESS] Sharp PNG error on attempt ${attempt + 1}:`, sharpError)
          break // PNG失败则尝试其他方法
        }
      }
    } catch (error) {
      console.log(`[COMPRESS] PNG compression failed, trying JPEG...`)
    }
    
    // 如果PNG压缩失败，尝试JPEG
    try {
      let quality = 60
      let maxWidth = 32
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const compressedBuffer = await sharp(Buffer.from(buffer))
            .resize(maxWidth, maxWidth, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality, progressive: true, optimiseScans: true })
            .toBuffer()
          
          console.log(`[COMPRESS] JPEG attempt ${attempt + 1}: ${maxWidth}px, quality ${quality} → ${compressedBuffer.length} bytes`)
          
          if (compressedBuffer.length <= maxSize) {
            const base64 = compressedBuffer.toString('base64')
            console.log(`[COMPRESS] ✓ JPEG compressed successfully: ${buffer.byteLength} → ${compressedBuffer.length} bytes`)
            return `data:image/jpeg;base64,${base64}`
          }
          
          maxWidth = Math.max(16, Math.floor(maxWidth * 0.8))
          quality = Math.max(20, quality - 15)
        } catch (sharpError) {
          console.log(`[COMPRESS] Sharp JPEG error on attempt ${attempt + 1}:`, sharpError)
        }
      }
    } catch (error) {
      console.log(`[COMPRESS] JPEG compression failed`)
    }
    
    console.log(`[COMPRESS] ✗ All compression attempts failed`)
    return null
  } catch (error) {
    console.warn(`[COMPRESS] Critical error:`, error)
    return null
  }
}

// (删除了独立的downloadImageAsBase64函数，现在集成在processImagesInJson中)

// 创建超小型占位符图片（确保SVG兼容性）
function createPlaceholderImage(): string {
  // 使用纯色方块而不是复杂图形，避免渲染问题
  const svg = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" fill="#f59e0b"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// 处理JSON，将图片URL转为base64
async function processImagesInJson(json: any): Promise<any> {
  if (Array.isArray(json)) {
    let totalImages = 0
    let downloadedImages = 0
    let placeholderImages = 0
    
    // 检测剧本规模
    const roleCount = json.filter(item => item.team && item.id !== '_meta').length
    const isLargeScript = roleCount > 15
    const isVeryLargeScript = roleCount > 20 // 超大剧本（如旧日熟识）
    console.log(`[PROCESS] Script analysis: ${roleCount} roles, isLarge: ${isLargeScript}, isVeryLarge: ${isVeryLargeScript}`)
    
    // 超大剧本使用更严格的压缩，但仍显示真实图片
    if (isVeryLargeScript) {
      console.log(`[PROCESS] Very large script detected (${roleCount} roles), using aggressive compression mode`)
    }
    
    // 根据剧本大小调整压缩策略
    const imageMaxSize = isVeryLargeScript ? 4 * 1024 : isLargeScript ? 8 * 1024 : 20 * 1024
    console.log(`[PROCESS] Using image size limit: ${imageMaxSize} bytes (very large: ${isVeryLargeScript})`)
    
    const processed = await Promise.all(
      json.map(async (item) => {
        // 处理角色图片
        if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
          totalImages++
          console.log(`[PROCESS] Processing role image: ${item.name || item.id} - ${item.image}`)
          
          try {
            const response = await fetch(item.image, { signal: AbortSignal.timeout(8000) })
            if (response.ok) {
              const buffer = await response.arrayBuffer()
              const contentType = response.headers.get('content-type') || 'image/png'
              const base64 = await compressImageToBase64(buffer, contentType, imageMaxSize)
              
              if (base64) {
                downloadedImages++
                return { ...item, image: base64 }
              } else {
                // 如果压缩失败，使用占位符而不是破坏SVG
                console.log(`[PROCESS] Compression failed for ${item.name || item.id}, using placeholder to maintain SVG integrity`)
                placeholderImages++
                return { ...item, image: createPlaceholderImage() }
              }
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            console.log(`[PROCESS] Download failed for ${item.name || item.id}:`, errorMsg)
          }
          
          // 只有在网络下载失败时才使用占位符
          placeholderImages++
          console.log(`[PROCESS] Using placeholder due to download failure: ${item.name || item.id}`)
          return { ...item, image: createPlaceholderImage() }
        }
        
        // 处理meta的logo图片
        if (item.id === '_meta' && item.logo && typeof item.logo === 'string' && item.logo.startsWith('http')) {
          totalImages++
          console.log(`[PROCESS] Processing meta logo: ${item.logo}`)
          
          try {
            const response = await fetch(item.logo, { signal: AbortSignal.timeout(8000) })
            if (response.ok) {
              const buffer = await response.arrayBuffer()
              const contentType = response.headers.get('content-type') || 'image/png'
              // meta logo使用更严格的压缩（5KB）
              const base64 = await compressImageToBase64(buffer, contentType, 5 * 1024)
              
              if (base64) {
                downloadedImages++
                return { ...item, logo: base64 }
              } else {
                // 如果meta logo压缩失败，使用占位符保证SVG完整性
                console.log(`[PROCESS] Meta logo compression failed, using placeholder`)
                placeholderImages++
                return { ...item, logo: createPlaceholderImage() }
              }
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            console.log(`[PROCESS] Meta logo download failed:`, errorMsg)
          }
          
          // 只有在网络下载失败时才使用占位符
          placeholderImages++
          console.log(`[PROCESS] Using placeholder due to meta logo download failure`)
          return { ...item, logo: createPlaceholderImage() }
        }
        
        return item
      })
    )
    
    console.log(`[PROCESS] Image processing complete: ${totalImages} total, ${downloadedImages} downloaded, ${placeholderImages} placeholders`)
    
    // 调试：检查处理后的图片数据
    const processedImages = processed.filter(item => item.image && item.image.startsWith('data:'))
    console.log(`[PROCESS] Processed images count: ${processedImages.length}`)
    processedImages.forEach((item, index) => {
      const imageSize = item.image ? item.image.length : 0
      console.log(`[PROCESS] Image ${index + 1} (${item.name || item.id}): ${imageSize} chars`)
    })
    
    return processed
  }
  return json
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('[API] Starting temp preview generation request')
    
    const body = await req.json().catch((err) => {
      console.error('[API] JSON parse error:', err)
      return null
    })
    
    if (!body || !body.json) {
      console.error('[API] Missing required fields:', { hasBody: !!body, hasJson: !!(body?.json) })
      return badRequest('Missing required fields: json')
    }
    
    console.log('[API] Request body received:', { 
      hasTitle: !!body.title, 
      hasAuthor: !!body.author, 
      jsonType: Array.isArray(body.json) ? 'array' : typeof body.json,
      jsonLength: Array.isArray(body.json) ? body.json.length : 'N/A'
    })
    
    const { id, title, author, json } = body
    
    // 从JSON中提取标题和作者（如果没有传入）
    const jsonData = json as any
    console.log(`[EXTRACT] JSON data type: ${Array.isArray(jsonData) ? 'array' : typeof jsonData}, length: ${Array.isArray(jsonData) ? jsonData?.length : 'N/A'}`)
    
    let jsonTitle = ''
    let jsonAuthor = ''
    
    if (Array.isArray(jsonData) && jsonData.length > 0) {
      // 查找_meta对象
      const meta = jsonData.find(item => item?.id === '_meta')
      if (meta) {
        jsonTitle = meta.name || meta.id || ''
        jsonAuthor = meta.author || ''
        console.log(`[EXTRACT] Found _meta: title="${jsonTitle}", author="${jsonAuthor}"`)
      } else {
        // 如果没有_meta，使用第一个非_meta对象
        const firstItem = jsonData.find(item => item?.id !== '_meta')
        jsonTitle = firstItem?.name || firstItem?.id || ''
        jsonAuthor = firstItem?.author || ''
        console.log(`[EXTRACT] No _meta found, using first item: title="${jsonTitle}", author="${jsonAuthor}"`)
      }
    } else if (jsonData && typeof jsonData === 'object') {
      jsonTitle = jsonData.name || jsonData.id || ''
      jsonAuthor = jsonData.author || ''
      console.log(`[EXTRACT] Object format: title="${jsonTitle}", author="${jsonAuthor}"`)
    }
    
    const finalTitle = title || jsonTitle || '未命名剧本'
    const finalAuthor = author || jsonAuthor || '未知作者'
    
    console.log(`[TEMP PREVIEW] Generating preview for "${finalTitle}" by ${finalAuthor}`)
    const genStartTime = Date.now()
    
    // 处理图片URL为base64
    const processedJson = await processImagesInJson(json)
    
    // 使用预览图生成器创建SVG
    const scriptData = {
      id: id || 'temp',
      title: finalTitle,
      author: finalAuthor, 
      json: processedJson
    }
    
    console.log('[SVG] Starting SVG generation with script data:', {
      title: scriptData.title,
      author: scriptData.author,
      jsonType: Array.isArray(scriptData.json) ? 'array' : typeof scriptData.json,
      jsonLength: Array.isArray(scriptData.json) ? scriptData.json.length : 'N/A'
    })
    
    let svg: string
    try {
      svg = generateScriptPreviewSVG(scriptData)
      console.log('[SVG] SVG generation completed successfully')
    } catch (svgError) {
      console.error('[SVG] SVG generation failed:', svgError)
      const errorMessage = svgError instanceof Error ? svgError.message : String(svgError)
      throw new Error(`SVG generation failed: ${errorMessage}`)
    }
    
    const genDuration = Date.now() - genStartTime
    
    // 检查SVG文件大小和内容
    const svgSize = Buffer.from(svg, 'utf-8').length
    console.log(`[FINAL] Generated SVG size: ${(svgSize / 1024 / 1024).toFixed(2)}MB`)
    
    // 调试：检查SVG内容
    console.log(`[FINAL] SVG content sample:`, svg.substring(0, 300))
    console.log(`[FINAL] SVG contains base64 images:`, svg.includes('data:image'))
    console.log(`[FINAL] SVG has valid structure:`, svg.startsWith('<svg') && svg.endsWith('</svg>'))
    
    // 检查是否包含无效字符
    const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(svg)
    if (hasInvalidChars) {
      console.warn(`[FINAL] SVG contains invalid control characters`)
    }
    
    const maxSvgSize = 8 * 1024 * 1024 // 8MB限制，平衡文件大小和图片质量
    if (svgSize > maxSvgSize) {
      console.error(`[FINAL] SVG too large: ${(svgSize / 1024 / 1024).toFixed(2)}MB > 8MB`)
      return badRequest(`预览图文件过大 (${(svgSize / 1024 / 1024).toFixed(1)}MB)，请尝试减少角色数量`)
    }
    
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
    
    // 提供更详细的错误信息
    let errorMessage = 'TEMP_PREVIEW_FAILED'
    if (error instanceof Error) {
      if (error.message.includes('SVG generation failed')) {
        errorMessage = `预览图生成失败: ${error.message}`
      } else if (error.message.includes('fetch')) {
        errorMessage = '网络错误: 无法下载角色图片'
      } else {
        errorMessage = `预览图生成失败: ${error.message}`
      }
    }
    
    return badRequest(errorMessage)
  }
}

