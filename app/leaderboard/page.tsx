import { prisma } from '@/src/db/client'

async function fetchLeaderboard(type?: 'likes' | 'favorites' | 'downloads') {
  const take = 50
  if (type === 'favorites') {
    const groups = await prisma.favorite.groupBy({ by: ['scriptId'], _count: { scriptId: true }, orderBy: { _count: { scriptId: 'desc' } }, take })
    const ids = groups.map(g => g.scriptId)
    const scripts = await prisma.script.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, authorName: true } })
    const map = new Map(scripts.map(s => [s.id, s]))
    const favorites = groups.map(g => ({ id: g.scriptId, title: map.get(g.scriptId)?.title || '', authorName: map.get(g.scriptId)?.authorName || null, count: g._count.scriptId }))
    return { likes: [], favorites, downloads: [] }
  }
  if (type === 'downloads') {
    const groups = await prisma.downloadEvent.groupBy({ by: ['scriptId'], _count: { scriptId: true }, orderBy: { _count: { scriptId: 'desc' } }, take })
    const ids = groups.map(g => g.scriptId)
    const scripts = await prisma.script.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, authorName: true } })
    const map = new Map(scripts.map(s => [s.id, s]))
    const downloads = groups.map(g => ({ id: g.scriptId, title: map.get(g.scriptId)?.title || '', authorName: map.get(g.scriptId)?.authorName || null, count: g._count.scriptId }))
    return { likes: [], favorites: [], downloads }
  }
  // default likes
  const groups = await prisma.like.groupBy({ by: ['scriptId'], _count: { scriptId: true }, orderBy: { _count: { scriptId: 'desc' } }, take })
  const ids = groups.map(g => g.scriptId)
  const scripts = await prisma.script.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, authorName: true } })
  const map = new Map(scripts.map(s => [s.id, s]))
  const likes = groups.map(g => ({ id: g.scriptId, title: map.get(g.scriptId)?.title || '', authorName: map.get(g.scriptId)?.authorName || null, count: g._count.scriptId }))
  return { likes, favorites: [], downloads: [] }
}

export default async function LeaderboardPage({ searchParams }: { searchParams?: Promise<{ type?: 'likes' | 'favorites' | 'downloads' }> }) {
  const sp = searchParams ? await searchParams : undefined
  const type = sp?.type === 'favorites' ? 'favorites' : (sp?.type === 'downloads' ? 'downloads' : 'likes')
  const { likes, favorites, downloads } = await fetchLeaderboard(type)
  const list = type==='likes' ? likes : (type==='favorites' ? favorites : downloads)
  const titleMap: Record<string, string> = { likes: '按点赞', favorites: '按收藏', downloads: '按下载' }
  const icon = type==='likes' ? '👍' : type==='favorites' ? '⭐' : '⬇️'
  return (
    <div className="container-page section">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">排行榜</h1>
        <div>
          <a className={`btn ${type==='likes'?'btn-primary':'btn-outline'}`} href="/leaderboard?type=likes">按点赞</a>
          <a className={`btn ml-2 ${type==='favorites'?'btn-primary':'btn-outline'}`} href="/leaderboard?type=favorites">按收藏</a>
          <a className={`btn ml-2 ${type==='downloads'?'btn-primary':'btn-outline'}`} href="/leaderboard?type=downloads">按下载</a>
        </div>
      </div>
      <div className="card mt-3">
        <div className="card-body">
          <div className="card-title">{titleMap[type]}</div>
          {!list.length && <div className="muted">暂无数据</div>}
          {!!list.length && (
            <div className="divide-y">
              {list.map((s, idx) => {
                const rank = idx + 1
                const isTop1 = idx === 0
                const isTop2 = idx === 1
                const isTop3 = idx === 2
                const rowCls = isTop1
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200'
                  : isTop2
                  ? 'bg-slate-50 hover:bg-slate-100'
                  : isTop3
                  ? 'bg-stone-50 hover:bg-stone-100'
                  : 'hover:bg-slate-50'
                const badgeCls = isTop1
                  ? 'bg-amber-500 text-white'
                  : isTop2
                  ? 'bg-gray-400 text-white'
                  : isTop3
                  ? 'bg-orange-400 text-white'
                  : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'
                const sizeCls = isTop1 ? 'h-8 w-8 text-sm' : 'h-7 w-7 text-xs'
                const countCls = isTop1 ? 'border-amber-300' : isTop2 ? 'border-gray-300' : isTop3 ? 'border-orange-300' : 'group-hover:border-blue-300'
                const medal = isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : ''
                return (
                  <a key={s.id} href={`/scripts/${s.id}`} className={`group flex items-center justify-between gap-3 py-2 rounded-lg px-2 ${rowCls}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center justify-center rounded-full font-medium ${badgeCls} ${sizeCls}`}>{rank}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[36rem]">{medal} {s.title}</div>
                        <div className="muted">作者：{s.authorName || '-'}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-sm border rounded-lg px-2 py-1 text-gray-700 ${countCls}`}>
                      <span>{icon}</span>
                      <span>{s.count}</span>
                    </span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


