import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

export async function GET(_req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')

  const topDownloads = await prisma.downloadEvent.groupBy({ by: ['scriptId'], _count: { scriptId: true }, orderBy: { _count: { scriptId: 'desc' } }, take: 10 })
  const topLikes = await prisma.like.groupBy({ by: ['scriptId'], _count: { scriptId: true }, orderBy: { _count: { scriptId: 'desc' } }, take: 10 }).catch(()=>[] as any)
  const topFavs = await prisma.favorite.groupBy({ by: ['scriptId'], _count: { scriptId: true }, orderBy: { _count: { scriptId: 'desc' } }, take: 10 }).catch(()=>[] as any)
  const ids = Array.from(new Set([...topDownloads, ...topLikes, ...topFavs].map((r:any)=>r.scriptId)))
  const scripts = await prisma.script.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
  const name = new Map(scripts.map(s=>[s.id, s.title]))
  return ok({
    topDownloads: topDownloads.map((r:any)=>({ id: r.scriptId, title: name.get(r.scriptId) || r.scriptId, count: r._count.scriptId })),
    topLikes: (topLikes as any[]).map(r=>({ id: r.scriptId, title: name.get(r.scriptId) || r.scriptId, count: r._count.scriptId })),
    topFavorites: (topFavs as any[]).map(r=>({ id: r.scriptId, title: name.get(r.scriptId) || r.scriptId, count: r._count.scriptId })),
  })
}


