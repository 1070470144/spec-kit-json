import { NextRequest } from 'next/server'
import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, unsupportedMediaType, badRequest, tooLarge } from '@/src/api/http'
import { LocalStorage } from '@/src/storage/local'

const MAX_SIZE = 5 * 1024 * 1024

export async function GET() {
  const s = await getSession()
  if (!s) return unauthorized()
  const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { storytellerLevel: true } })
  const last = await prisma.storytellerApplication.findFirst({ where: { userId: s.userId }, orderBy: { createdAt: 'desc' } })
  return ok({ level: u?.storytellerLevel || 0, status: last?.status || 'none', reason: last?.reason || null })
}

export async function POST(req: NextRequest) {
  const s = await getSession()
  if (!s) return unauthorized()
  const ct = req.headers.get('content-type') || ''
  if (!ct.includes('multipart/form-data')) return unsupportedMediaType()
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return badRequest('MISSING_FILE')
  if (file.size > MAX_SIZE) return tooLarge('FILE_TOO_LARGE')
  const buf = Buffer.from(await file.arrayBuffer())
  const storage = new LocalStorage()
  const meta = await storage.save(buf, file.name || 'storyteller', file.type || 'application/octet-stream')
  await prisma.storytellerApplication.create({ data: { userId: s.userId, imagePath: meta.path, status: 'pending', level: 0 } })
  return ok({})
}


