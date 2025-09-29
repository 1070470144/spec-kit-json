import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized, forbidden, invalidPayload } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

const KEY = 'system.sensitiveWords'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const row = await (prisma as any)["systemConfig"].findUnique({ where: { key: KEY } })
  const list = row?.value ? row.value.split(',').map((s:string)=>s.trim()).filter(Boolean) : []
  return ok({ words: list })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  const body = await req.json().catch(()=>null)
  if (!body || !Array.isArray(body.words)) return invalidPayload('words must be string[]')
  const sanitized = (body.words as string[]).map(s=>String(s||'').trim()).filter(Boolean)
  await (prisma as any)["systemConfig"].upsert({ where: { key: KEY }, update: { value: sanitized.join(',') }, create: { key: KEY, value: sanitized.join(',') } })
  return ok({})
}


