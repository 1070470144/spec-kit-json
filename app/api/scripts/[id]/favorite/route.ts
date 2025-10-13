import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getSession } from '@/src/auth/session'
import { invalidateCache } from '@/src/cache/api-cache'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const s = await getSession()
  if (!s) return unauthorized()
  try { await prisma.favorite.create({ data: { scriptId: p.id, userId: s.userId } }) } catch {}
  const count = await prisma.favorite.count({ where: { scriptId: p.id } })
  
  // 清除收藏榜缓存（收藏影响排行榜）
  invalidateCache('leaderboard-favorites')
  invalidateCache(`script-${p.id}`)  // 详情页也显示收藏数
  
  return ok({ favorited: true, count })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const s = await getSession()
  if (!s) return unauthorized()
  await prisma.favorite.deleteMany({ where: { scriptId: p.id, userId: s.userId } })
  const count = await prisma.favorite.count({ where: { scriptId: p.id } })
  
  // 清除收藏榜缓存（取消收藏影响排行榜）
  invalidateCache('leaderboard-favorites')
  invalidateCache(`script-${p.id}`)
  
  return ok({ favorited: false, count })
}


