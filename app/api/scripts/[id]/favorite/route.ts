import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getSession } from '@/src/auth/session'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession()
  if (!s) return unauthorized()
  try { await prisma.favorite.create({ data: { scriptId: params.id, userId: s.userId } }) } catch {}
  const count = await prisma.favorite.count({ where: { scriptId: params.id } })
  return ok({ favorited: true, count })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession()
  if (!s) return unauthorized()
  await prisma.favorite.deleteMany({ where: { scriptId: params.id, userId: s.userId } })
  const count = await prisma.favorite.count({ where: { scriptId: params.id } })
  return ok({ favorited: false, count })
}


