import { z } from 'zod'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, forbidden, invalidPayload } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

const KEYS = ['smtp.host','smtp.port','smtp.user','smtp.pass','mail.from'] as const
type Key = typeof KEYS[number]

function pickKeys(obj: Record<string, string | undefined>) {
  const out: Record<Key, string | undefined> = {
    'smtp.host': obj['smtp.host'],
    'smtp.port': obj['smtp.port'],
    'smtp.user': obj['smtp.user'],
    'smtp.pass': obj['smtp.pass'],
    'mail.from': obj['mail.from']
  }
  return out
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return unauthorized('NOT_ADMIN')
  const rows = await (prisma as any)["systemConfig"].findMany({ where: { key: { in: KEYS as unknown as string[] } } })
  const data: Record<string, string> = {}
  for (const r of rows) data[r.key] = r.value
  return ok(data)
}

const schema = z.object({
  'smtp.host': z.string().min(1).optional(),
  'smtp.port': z.string().optional(),
  'smtp.user': z.string().optional(),
  'smtp.pass': z.string().optional(),
  'mail.from': z.string().optional()
}).strict()

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return unauthorized('NOT_ADMIN')
  const admin = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, roles: { select: { key: true } } } })
  const isSuper = (admin?.roles || []).some(r => r.key === 'superuser')
  if (!isSuper) return forbidden('SUPERUSER_ONLY')

  let body: unknown
  try { body = await req.json() } catch { return invalidPayload('INVALID_JSON') }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return invalidPayload(parsed.error.issues)
  const payload = pickKeys(parsed.data as Record<string, string | undefined>)
  // 统一去除首尾空格
  ;(Object.keys(payload) as Key[]).forEach(k => {
    const v = payload[k]
    if (typeof v === 'string') payload[k] = v.trim()
  })

  await Promise.all(
    (Object.keys(payload) as Key[]).filter(k => typeof payload[k] !== 'undefined').map(async (k) => {
      const value = String(payload[k])
      await (prisma as any)["systemConfig"].upsert({
        where: { key: k },
        update: { value },
        create: { key: k, value }
      })
    })
  )
  return ok({})
}


