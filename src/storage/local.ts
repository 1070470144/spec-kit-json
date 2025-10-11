import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'
import type { Storage, StoredObjectMeta } from './Storage'

const uploadDir = process.env.UPLOAD_DIR || './uploads'

export class LocalStorage implements Storage {
  // 获取基础存储目录
  get basePath(): string {
    return uploadDir
  }
  
  // 获取完整路径
  getAbsolutePath(relativePath: string): string {
    return join(uploadDir, relativePath)
  }
  
  // 保存文件并返回相对路径
  async put(relativePath: string, buffer: Buffer, mime = 'application/octet-stream'): Promise<string> {
    const fullPath = this.getAbsolutePath(relativePath)
    const dir = join(fullPath, '../')
    
    mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, buffer)
    
    console.log(`[STORAGE] Saved file to: ${fullPath}`)
    return fullPath
  }
  
  async save(buffer: Buffer, keyHint: string, mime: string): Promise<StoredObjectMeta> {
    mkdirSync(uploadDir, { recursive: true })
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
    const filename = `${sha256}-${keyHint}`
    const absolutePath = join(uploadDir, filename)
    writeFileSync(absolutePath, buffer)
    // 返回相对路径而不是绝对路径
    return { path: filename, mime, size: buffer.byteLength, sha256 }
  }
  
  async getSignedUrl(path: string): Promise<string> {
    return `/api/files?path=${encodeURIComponent(path)}`
  }
}
