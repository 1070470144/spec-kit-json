import { NextRequest } from 'next/server'
import { badRequest, internalError } from '@/src/api/http'

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
      const sharp = require('sharp')
      
      // 将SVG字符串转为Buffer
      const svgBuffer = Buffer.from(svg, 'utf-8')
      
      // 转换为PNG，设置较高的分辨率
      const pngBuffer = await sharp(svgBuffer)
        .png({
          quality: 100,
          compressionLevel: 9
        })
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
      // 如果sharp不可用，尝试使用canvas方法
      console.warn('[SVG to PNG] Sharp conversion failed, trying canvas method:', error)
      
      // 使用canvas进行转换（需要canvas库）
      const { createCanvas, Image } = require('canvas')
      
      // 从SVG中提取尺寸
      const widthMatch = svg.match(/width="(\d+)"/)
      const heightMatch = svg.match(/height="(\d+)"/)
      const width = widthMatch ? parseInt(widthMatch[1]) : 800
      const height = heightMatch ? parseInt(heightMatch[1]) : 1200
      
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')
      
      // 创建图片对象
      const img = new Image()
      img.src = Buffer.from(svg, 'utf-8')
      
      // 等待图片加载
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height)
          resolve()
        }
        img.onerror = reject
      })
      
      // 转换为PNG
      const pngBuffer = canvas.toBuffer('image/png')
      
      const duration = Date.now() - startTime
      console.log(`[SVG to PNG] Canvas conversion completed in ${duration}ms`)
      
      return new Response(pngBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="preview.png"',
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

