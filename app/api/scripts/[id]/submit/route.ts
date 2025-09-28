import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, badRequest } from '@/src/api/http'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const found = await prisma.script.findUnique({ where: { id: params.id }, select: { id: true, state: true } })
  if (!found) return notFound()
  if (found.state !== 'draft' && found.state !== 'rejected') {
    return badRequest('INVALID_STATE')
  }
  const updated = await prisma.script.update({ where: { id: params.id }, data: { state: 'pending' }, select: { id: true, state: true } })
  return ok(updated)
}
