import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound } from '@/src/api/http'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const v = await prisma.scriptJSON.findFirst({ where: { scriptId: id }, orderBy: { createdAt: 'desc' } })
  if (!v) return notFound()
  let obj: unknown = null
  try { obj = JSON.parse(v.content) } catch { obj = null }
  return ok(obj)
}
