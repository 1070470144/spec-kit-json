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
    
    const { svg } = body
    
    console.log(`[SVG to PNG] Converting SVG (${svg.length} bytes)`)
    
    // 使用sharp库转换SVG到PNG
    try {
      // 将SVG字符串转为Buffer
      const svgBuffer = Buffer.from(svg, 'utf-8')
      
      // 从SVG中提取尺寸，并设置最大边限制，避免极端情况
      const widthMatch = svg.match(/width="(\d+)"/)
      const heightMatch = svg.match(/height="(\d+)"/)
      const width = widthMatch ? parseInt(widthMatch[1]) : 800
      const height = heightMatch ? parseInt(heightMatch[1]) : 1200
      const maxDim = 2000
      const targetWidth = Math.min(width, maxDim)
      const targetHeight = Math.min(height, maxDim)
      
      const pngBuffer = await sharp(svgBuffer, { density: 240 })
        .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
        .png({ quality: 90, compressionLevel: 9 })
        .toBuffer()
      
      const duration = Date.now() - startTime
      console.log(`[SVG to PNG] Conversion completed in ${duration}ms, PNG size: ${pngBuffer.length} bytes`)
      
      // 返回PNG图片
      return new Response(pngBuffer, {
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

