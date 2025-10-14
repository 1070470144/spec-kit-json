import { NextRequest } from 'next/server'
import { badRequest, internalError } from '@/src/api/http'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await req.json().catch(() => null)
    
    if (!body || !body.svg) {
      return badRequest('Missing required field: svg')
    }
    
    const { svg, quality = 'normal' } = body
    
    console.log(`[SVG to PNG] Converting SVG (${svg.length} bytes), quality: ${quality}`)
    
    // 使用sharp库转换SVG到PNG
    try {
      // 将SVG字符串转为Buffer
      const svgBuffer = Buffer.from(svg, 'utf-8')
      
      // 从SVG中提取尺寸
      const widthMatch = svg.match(/width="(\d+)"/)
      const heightMatch = svg.match(/height="(\d+)"/)
      const width = widthMatch ? parseInt(widthMatch[1]) : 800
      const height = heightMatch ? parseInt(heightMatch[1]) : 1200
      
      // 根据质量选择参数
      const params = quality === 'ultra' 
        ? {
            density: 1200,          // 极致密度 (提升2倍)
            scale: 6,               // 6倍放大 (提升1.5倍)
            quality: 100,           // 无损质量
            compressionLevel: 0,    // 无压缩
            maxDim: null            // 无尺寸限制
          }
        : {
            density: 240,           // 标准密度
            scale: 1,               // 原始尺寸
            quality: 90,            // 标准质量
            compressionLevel: 9,    // 最大压缩
            maxDim: 2000            // 限制最大尺寸
          }
      
      // 计算目标尺寸
      const scaledWidth = width * params.scale
      const scaledHeight = height * params.scale
      const targetWidth = params.maxDim ? Math.min(scaledWidth, params.maxDim) : scaledWidth
      const targetHeight = params.maxDim ? Math.min(scaledHeight, params.maxDim) : scaledHeight
      
      const pngBuffer = await sharp(svgBuffer, { density: params.density })
        .resize(targetWidth, targetHeight, { 
          fit: 'inside', 
          withoutEnlargement: quality !== 'ultra'  // 超高清允许放大
        })
        .png({ 
          quality: params.quality, 
          compressionLevel: params.compressionLevel 
        })
        .toBuffer()
      
      const duration = Date.now() - startTime
      const fileSizeMB = (pngBuffer.length / 1024 / 1024).toFixed(2)
      console.log(`[SVG to PNG] Quality: ${quality}, Conversion completed in ${duration}ms, PNG size: ${pngBuffer.length} bytes (${fileSizeMB}MB)`)
      
      // 返回PNG图片
      return new Response(pngBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="preview.png"',
          'Cache-Control': 'no-cache'
        }
      })
      
    } catch (error) {
      // 保底：返回原始SVG，避免500
      console.warn('[SVG to PNG] Conversion failed, returning original SVG. Error:', error)
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': 'attachment; filename="preview.svg"',
          'Cache-Control': 'no-cache'
        }
      })
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API ERROR] POST /api/tools/convert-svg-to-png - ${duration}ms:`, error)
    return internalError('SVG_TO_PNG_CONVERSION_FAILED')
  }
}

