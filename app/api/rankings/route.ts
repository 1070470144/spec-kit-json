import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, badRequest } from '@/src/api/http'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || 'all' // '7d' | '30d' | 'all'
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || '20')))

  let since: Date | undefined
  if (range === '7d') since = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  if (range === '30d') since = new Date(Date.now() - 30 * 24 * 3600 * 1000)
  if (!['7d','30d','all'].includes(range)) return badRequest('invalid range')

  const where = since ? { createdAt: { gte: since } } : {}

  const rows = await prisma.downloadEvent.groupBy({
    by: ['scriptId'],
    where,
    _count: { scriptId: true },
    orderBy: { _count: { scriptId: 'desc' } },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const ids = rows.map(r => r.scriptId)
  const scripts = await prisma.script.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, authorName: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } }
  })
  const idToScript = new Map(scripts.map(s => [s.id, s]))
  const totalRows = await prisma.downloadEvent.groupBy({ by: ['scriptId'], where, _count: { scriptId: true } })
  const total = totalRows.length
  const items = rows.map((r, idx) => {
    const s = idToScript.get(r.scriptId)
    const cover = s?.images?.[0]?.path ? `/api/files?path=${encodeURIComponent(s.images[0].path)}` : undefined
    return { rank: (page - 1) * pageSize + idx + 1, scriptId: r.scriptId, title: s?.title || '', author: s?.authorName || null, downloads: r._count.scriptId, cover }
  })

  return ok({ items, range, page, pageSize, total })
}


