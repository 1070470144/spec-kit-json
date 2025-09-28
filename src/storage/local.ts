import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'
import type { Storage, StoredObjectMeta } from './Storage'

const uploadDir = process.env.UPLOAD_DIR || './uploads'

export class LocalStorage implements Storage {
  async save(buffer: Buffer, keyHint: string, mime: string): Promise<StoredObjectMeta> {
    mkdirSync(uploadDir, { recursive: true })
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
    const filename = `${sha256}-${keyHint}`
    const path = join(uploadDir, filename)
    writeFileSync(path, buffer)
    return { path, mime, size: buffer.byteLength, sha256 }
  }
  async getSignedUrl(path: string): Promise<string> {
    return `/api/files?path=${encodeURIComponent(path)}`
  }
}
