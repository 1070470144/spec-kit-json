import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { z } from 'zod'
import { ok, unsupportedMediaType, badRequest, tooLarge, internalError } from '@/src/api/http'
import { parseJson } from '@/src/api/validate'
import { LocalStorage } from '@/src/storage/local'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state') || undefined
  const q = searchParams.get('q') || undefined
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || '20')))
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (state) where.state = state
  if (q) where.title = { contains: q }

  const [items, total] = await Promise.all([
    prisma.script.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: { id: true, title: true, language: true, state: true, createdAt: true }
    }),
    prisma.script.count({ where })
  ])

  return ok({ items, total, page, pageSize })
}

const createSchema = z.object({ title: z.string().min(1), json: z.any() })
const ALLOWED = new Set(['image/jpeg','image/png','image/webp'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_IMAGES = 3
const MAX_JSON_SIZE = 5 * 1024 * 1024

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    try {
      const form = await req.formData()
      const title = String(form.get('title') || '')
      const authorName = form.get('authorName') ? String(form.get('authorName')) : null
      const jsonFile = form.get('jsonFile') as File | null
      const images = form.getAll('images') as (File | null)[]

      if (!title || !jsonFile) return badRequest('title and jsonFile are required')
      if (jsonFile.size > MAX_JSON_SIZE) return tooLarge('JSON file too large')

      const jsonText = await jsonFile.text()
      let json: unknown
      try {
        json = JSON.parse(jsonText)
      } catch (e) {
        return badRequest('Invalid JSON file')
      }

      if (images.length > MAX_IMAGES) return badRequest('Too many images (max 3)')

      const storage = new LocalStorage()
      const contentStr = JSON.stringify(json)
      const created = await prisma.script.create({
        data: {
          title,
          authorName: authorName || undefined,
          versions: {
            create: {
              content: contentStr,
              contentHash: String(contentStr.length),
              schemaValid: true,
              version: 1
            }
          }
        },
        select: { id: true }
      })

      let sortOrder = 0
      for (const f of images) {
        if (!f) continue
        if (!ALLOWED.has(f.type)) return unsupportedMediaType('IMAGE_TYPE_NOT_ALLOWED')
        const buf = Buffer.from(await f.arrayBuffer())
        if (buf.byteLength > MAX_IMAGE_SIZE) return tooLarge('FILE_TOO_LARGE')
        const meta = await storage.save(buf, f.name || 'image', f.type || 'application/octet-stream')
        await prisma.imageAsset.create({
          data: {
            scriptId: created.id,
            path: meta.path,
            mime: meta.mime,
            size: meta.size,
            sha256: meta.sha256 || '',
            sortOrder: sortOrder++,
            isCover: false
          }
        })
      }

      return ok({ id: created.id }, 201)
    } catch (e: any) {
      return internalError('UPLOAD_FAILED', e?.message)
    }
  }

  if (!contentType.includes('application/json')) {
    return unsupportedMediaType()
  }
  const parsed = await parseJson(req, createSchema)
  if (!parsed.ok) return parsed.res
  const { title, json } = parsed.data

  if (typeof json !== 'object') {
    return badRequest('json must be object')
  }

  const contentStr = JSON.stringify(json)
  const created = await prisma.script.create({
    data: {
      title,
      versions: {
        create: {
          content: contentStr,
          contentHash: String(contentStr.length),
          schemaValid: true,
          version: 1
        }
      }
    },
    select: { id: true }
  })
  return ok({ id: created.id }, 201)
}
