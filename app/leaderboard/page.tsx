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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-headline-small text-surface-on">排行榜</h1>
        <div className="grid grid-cols-3 sm:inline-flex rounded-sm border border-outline overflow-hidden w-full sm:w-auto">
          <a 
            className={`m3-segmented-btn min-h-touch text-sm sm:text-base ${type==='likes'?'m3-segmented-btn-active':''}`} 
            href="/leaderboard?type=likes"
          >
            👍 点赞
          </a>
          <a 
            className={`m3-segmented-btn min-h-touch text-sm sm:text-base ${type==='favorites'?'m3-segmented-btn-active':''}`} 
            href="/leaderboard?type=favorites"
          >
            ⭐ 收藏
          </a>
          <a 
            className={`m3-segmented-btn min-h-touch text-sm sm:text-base ${type==='downloads'?'m3-segmented-btn-active':''}`} 
            href="/leaderboard?type=downloads"
          >
            ⬇️ 下载
          </a>
        </div>
      </div>
      <div className="m3-card-elevated">
        <div className="p-4 sm:p-6">
          <div className="text-lg sm:text-xl lg:text-title-large mb-4 text-surface-on">{titleMap[type]}</div>
          {!list.length && <div className="text-sm sm:text-base text-surface-on-variant">暂无数据</div>}
          {!!list.length && (
            <div className="divide-y divide-outline-variant">
              {list.map((s, idx) => {
                const rank = idx + 1
                const isTop1 = idx === 0
                const isTop2 = idx === 1
                const isTop3 = idx === 2
                const rowCls = isTop1
                  ? 'bg-amber-50 hover:bg-amber-100'
                  : isTop2
                  ? 'bg-slate-50 hover:bg-slate-100'
                  : isTop3
                  ? 'bg-orange-50 hover:bg-orange-100'
                  : 'hover:bg-surface-variant'
                const badgeCls = isTop1
                  ? 'bg-amber-500 text-white shadow-elevation-2'
                  : isTop2
                  ? 'bg-gray-400 text-white shadow-elevation-1'
                  : isTop3
                  ? 'bg-orange-400 text-white'
                  : 'bg-surface border border-outline text-surface-on'
                const sizeCls = isTop1 ? 'h-9 w-9 text-label-large' : 'h-8 w-8 text-label-medium'
                const medal = isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : ''
                return (
                  <a 
                    key={s.id} 
                    href={`/scripts/${s.id}`} 
                    className={`group flex items-center justify-between gap-4 py-3 rounded-sm px-3 transition-all duration-standard ${rowCls}`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className={`m3-rank-badge ${badgeCls} ${sizeCls}`}>{rank}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-title-medium truncate">{medal} {s.title}</div>
                        <div className="text-body-small text-surface-on-variant">作者：{s.authorName || '-'}</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-body-medium border border-outline rounded-sm px-3 py-1.5 text-surface-on bg-surface">
                      <span>{icon}</span>
                      <span className="font-medium">{s.count}</span>
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


