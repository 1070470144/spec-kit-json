import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { LocalStorage } from '@/src/storage/local'
import { ok, unsupportedMediaType, notFound, tooLarge, badRequest } from '@/src/api/http'

const ALLOWED = new Set(['image/jpeg','image/png','image/webp'])
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const script = await prisma.script.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!script) return notFound()

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) return unsupportedMediaType()

  const form = await req.formData()
  const files = form.getAll('files') as (File | null)[]
  if (!files || files.length === 0) return badRequest('NO_FILES')

  const storage = new LocalStorage()
  const existingCount = await prisma.imageAsset.count({ where: { scriptId: script.id } })
  let sortOrder = existingCount

  const created: Array<{ id: string; url: string }> = []

  for (const f of files) {
    if (!f) continue
    if (!ALLOWED.has(f.type)) return unsupportedMediaType('IMAGE_TYPE_NOT_ALLOWED')
    const arrayBuf = await f.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)
    if (buffer.byteLength > MAX_SIZE) return tooLarge('FILE_TOO_LARGE')

    const meta = await storage.save(buffer, f.name || 'image', f.type || 'application/octet-stream')

    const row = await prisma.imageAsset.create({
      data: {
        scriptId: script.id,
        path: meta.path,
        mime: meta.mime,
        size: meta.size,
        sha256: meta.sha256 || '',
        sortOrder: sortOrder++,
        isCover: false
      },
      select: { id: true, path: true }
    })
    created.push({ id: row.id, url: `/api/files?path=${encodeURIComponent(meta.path)}` })
  }

  return ok({ items: created }, 201)
}
