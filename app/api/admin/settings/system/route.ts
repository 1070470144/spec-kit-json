import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, forbidden, invalidPayload, badRequest } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

const KEY = 'system.openRegister'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return unauthorized('NOT_ADMIN')
  const row = await (prisma as any)["systemConfig"].findUnique({ where: { key: KEY } })
  const openRegister = row?.value ?? 'true'
  return ok({ openRegister })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return unauthorized('NOT_ADMIN')
  const admin = await prisma.user.findUnique({ where: { id: session.userId }, select: { roles: { select: { key: true } } } })
  const isSuper = (admin?.roles || []).some(r => r.key === 'superuser')
  if (!isSuper) return forbidden('SUPERUSER_ONLY')
  let body: any
  try { body = await req.json() } catch { return invalidPayload('INVALID_JSON') }
  if (typeof body?.openRegister !== 'boolean') return badRequest('openRegister must be boolean')
  await (prisma as any)["systemConfig"].upsert({ where: { key: KEY }, update: { value: String(body.openRegister) }, create: { key: KEY, value: String(body.openRegister) } })
  return ok({})
}


