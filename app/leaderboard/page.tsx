async function fetchLeaderboard(type?: 'likes' | 'favorites' | 'downloads') {
  const suffix = type ? `?type=${type}` : ''
  const res = await fetch(`http://localhost:3000/api/leaderboard${suffix}`, { cache: 'no-store' })
  const j = await res.json().catch(()=>({}))
  const likes = (j?.data?.likes ?? j?.likes ?? []) as { id:string; title:string; authorName?:string|null; count:number }[]
  const favorites = (j?.data?.favorites ?? j?.favorites ?? []) as { id:string; title:string; authorName?:string|null; count:number }[]
  const downloads = (j?.data?.downloads ?? j?.downloads ?? []) as { id:string; title:string; authorName?:string|null; count:number }[]
  return { likes, favorites, downloads }
}

export default async function LeaderboardPage({ searchParams }: { searchParams: { type?: 'likes' | 'favorites' | 'downloads' } }) {
  const type = searchParams?.type === 'favorites' ? 'favorites' : (searchParams?.type === 'downloads' ? 'downloads' : 'likes')
  const { likes, favorites, downloads } = await fetchLeaderboard(type)
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
        <div className="card-body space-y-1">
          {(type==='likes' ? likes : (type==='favorites' ? favorites : downloads)).map((s, idx) => (
            <a key={s.id} href={`/scripts/${s.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
              <div>
                <div className="font-medium">{idx+1}. {s.title}</div>
                <div className="muted">作者：{s.authorName || '-'}</div>
              </div>
              <span className="btn btn-outline">{type==='likes' ? '👍' : (type==='favorites' ? '⭐' : '⬇️')} {s.count}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}


