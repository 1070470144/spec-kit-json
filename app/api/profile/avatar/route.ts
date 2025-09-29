import { getSession } from '@/src/auth/session'
import { prisma } from '@/src/db/client'
import { ok, badRequest, unauthorized, unsupportedMediaType, tooLarge, internalError } from '@/src/api/http'
import { LocalStorage } from '@/src/storage/local'

const ALLOWED = new Set(['image/jpeg','image/png','image/webp'])
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: Request) {
  const s = await getSession()
  if (!s) return unauthorized()
  const ct = req.headers.get('content-type') || ''
  if (!ct.includes('multipart/form-data')) return unsupportedMediaType()
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return badRequest('MISSING_FILE')
    if (!ALLOWED.has(file.type)) return unsupportedMediaType('IMAGE_TYPE_NOT_ALLOWED')
    if (file.size > MAX_SIZE) return tooLarge('FILE_TOO_LARGE')
    const buf = Buffer.from(await file.arrayBuffer())
    const storage = new LocalStorage()
    const meta = await storage.save(buf, file.name || 'avatar', file.type)
    const url = await storage.getSignedUrl(meta.path)
    await prisma.user.update({ where: { id: s.userId }, data: { avatarUrl: url } })
    return ok({ url })
  } catch (e:any) {
    return internalError('UPLOAD_FAILED', e?.message)
  }
}


