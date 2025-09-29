import { prisma } from '@/src/db/client'
import { ok, unauthorized, badRequest } from '@/src/api/http'
import { getSession } from '@/src/auth/session'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const s = await getSession()
  if (!s) return unauthorized()
  try {
    await prisma.like.create({ data: { scriptId: id, userId: s.userId } })
  } catch {}
  const count = await prisma.like.count({ where: { scriptId: id } })
  return ok({ liked: true, count })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const s = await getSession()
  if (!s) return unauthorized()
  await prisma.like.deleteMany({ where: { scriptId: id, userId: s.userId } })
  const count = await prisma.like.count({ where: { scriptId: id } })
  return ok({ liked: false, count })
}


