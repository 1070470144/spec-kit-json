import { prisma } from '@/src/db/client'
import { ok, unauthorized, badRequest } from '@/src/api/http'
import { getSession } from '@/src/auth/session'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession()
  if (!s) return unauthorized()
  try {
    await prisma.like.create({ data: { scriptId: params.id, userId: s.userId } })
  } catch {}
  const count = await prisma.like.count({ where: { scriptId: params.id } })
  return ok({ liked: true, count })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession()
  if (!s) return unauthorized()
  await prisma.like.deleteMany({ where: { scriptId: params.id, userId: s.userId } })
  const count = await prisma.like.count({ where: { scriptId: params.id } })
  return ok({ liked: false, count })
}


