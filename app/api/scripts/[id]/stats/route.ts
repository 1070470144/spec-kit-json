import { prisma } from '@/src/db/client'
import { ok } from '@/src/api/http'
import { getSession } from '@/src/auth/session'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession()
  const [likes, favorites] = await Promise.all([
    prisma.like.count({ where: { scriptId: params.id } }),
    prisma.favorite.count({ where: { scriptId: params.id } })
  ])
  const me = s ? await prisma.$transaction([
    prisma.like.count({ where: { scriptId: params.id, userId: s.userId } }),
    prisma.favorite.count({ where: { scriptId: params.id, userId: s.userId } })
  ]) : [0, 0]
  return ok({ likes, favorites, liked: !!me[0], favorited: !!me[1] })
}


