import { prisma } from '@/src/db/client'
import { ok, badRequest } from '@/src/api/http'
import { getSession } from '@/src/auth/session'

type BatchBody = { ids?: string[] }

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as BatchBody | null
  const ids = Array.from(new Set((body?.ids || []).filter(id => typeof id === 'string' && id.length > 0)))
  if (!ids.length) return badRequest('EMPTY_IDS')

  // counts by group
  const [likeGroups, favGroups] = await Promise.all([
    prisma.like.groupBy({ by: ['scriptId'], where: { scriptId: { in: ids } }, _count: { scriptId: true } }),
    prisma.favorite.groupBy({ by: ['scriptId'], where: { scriptId: { in: ids } }, _count: { scriptId: true } })
  ])
  const likeCountMap = new Map<string, number>(likeGroups.map(g => [g.scriptId, g._count.scriptId]))
  const favCountMap = new Map<string, number>(favGroups.map(g => [g.scriptId, g._count.scriptId]))

  const s = await getSession()
  let likedSet = new Set<string>(), favoritedSet = new Set<string>()
  if (s) {
    const [liked, favorited] = await Promise.all([
      prisma.like.findMany({ where: { userId: s.userId, scriptId: { in: ids } }, select: { scriptId: true } }),
      prisma.favorite.findMany({ where: { userId: s.userId, scriptId: { in: ids } }, select: { scriptId: true } }),
    ])
    likedSet = new Set(liked.map(x => x.scriptId))
    favoritedSet = new Set(favorited.map(x => x.scriptId))
  }

  const result: Record<string, { likes: number; favorites: number; liked: boolean; favorited: boolean }> = {}
  for (const id of ids) {
    result[id] = {
      likes: likeCountMap.get(id) || 0,
      favorites: favCountMap.get(id) || 0,
      liked: likedSet.has(id),
      favorited: favoritedSet.has(id)
    }
  }

  return ok({ items: result })
}


