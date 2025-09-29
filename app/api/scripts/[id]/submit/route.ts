import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, badRequest } from '@/src/api/http'

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const found = await prisma.script.findUnique({ where: { id }, select: { id: true, state: true } })
  if (!found) return notFound()
  if (found.state !== 'rejected') {
    return badRequest('INVALID_STATE')
  }
  const updated = await prisma.script.update({ where: { id }, data: { state: 'pending' }, select: { id: true, state: true } })
  return ok(updated)
}
