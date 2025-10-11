import { NextRequest } from 'next/server'
import { createReadStream, statSync, existsSync } from 'node:fs'
import { isAbsolute, join, resolve, normalize, sep, extname } from 'node:path'
import { notFound, badRequest } from '@/src/api/http'

const uploadDir = resolve(process.env.UPLOAD_DIR || './uploads')

// MIME type 映射
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return badRequest('MISSING_PATH')

  try {
    // 处理相对路径和绝对路径
    const fullPath = isAbsolute(path) ? normalize(path) : resolve(uploadDir, path)
    
    // 安全检查：确保路径在 uploadDir 内
    if (!fullPath.startsWith(uploadDir + sep) && fullPath !== uploadDir) {
      console.warn('[API FILES] Potential path traversal attempt:', path, '→', fullPath)
      return notFound()
    }
    
    // 检查文件是否存在
    if (!existsSync(fullPath)) {
      console.log('[API FILES] File not found:', fullPath)
      return notFound()
    }
    
    const stat = statSync(fullPath)
    const stream = createReadStream(fullPath)
    
    // 根据文件扩展名确定 Content-Type
    const ext = extname(fullPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    
    return new Response(stream as unknown as ReadableStream, { 
      headers: { 
        'content-type': contentType,
        'content-length': String(stat.size),
        'cache-control': 'public, max-age=31536000, immutable',
      } 
    })
  } catch (error) {
    console.error('[API FILES] Error serving file:', error)
    return notFound()
  }
}
