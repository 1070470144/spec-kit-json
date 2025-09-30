async function fetchList(page = 1, pageSize = 24, q?: string) {
  const qs = new URLSearchParams({ state: 'published', page: String(page), pageSize: String(pageSize), ...(q ? { q } : {}) })
  const base = process.env.APP_BASE_URL || ''
  const res = await fetch(`${base}/api/scripts?${qs.toString()}`, { cache: 'no-store' })
  const j = await res.json()
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string; authorName?: string|null }[]
  const total = Number(j?.data?.total ?? j?.total ?? 0)
  return { items, total, page, pageSize }
}

export default async function ScriptsPage({ searchParams }: { searchParams?: Promise<{ page?: string; q?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const pageNum = Math.max(1, Number(sp?.page || '1'))
  const q = sp?.q?.trim() || ''
  const { items, total, page, pageSize } = await fetchList(pageNum, 24, q)
  // 批量预取当前页的点赞/收藏统计
  let statsMap: Record<string, { likes:number; favorites:number; liked:boolean; favorited:boolean }> = {}
  try {
    const res = await fetch('http://localhost:3000/api/scripts/stats-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: items.map(i=>i.id) }) })
    const j = await res.json().catch(()=>({}))
    statsMap = (j?.data?.items ?? j?.items ?? {}) as typeof statsMap
  } catch {}
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/scripts?${new URLSearchParams({ page: String(p), ...(q ? { q } : {}) }).toString()}`
  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">剧本列表</h1>
      <form className="flex gap-2" action="/scripts" method="get">
        <input className="input" name="q" placeholder="搜索剧本标题..." defaultValue={q} />
        {/* 重置到第 1 页 */}
        <input type="hidden" name="page" value="1" />
        <button className="btn btn-primary" type="submit">搜索</button>
        {q && <a className="btn btn-outline" href="/scripts">清除</a>}
      </form>
      <div className="grid-cards">
        {/* 预取当前页所有脚本的统计，子组件从缓存读取，避免 N 次独立请求 */}
        <script
          dangerouslySetInnerHTML={{ __html: `window.dispatchEvent(new CustomEvent('scripts:prefetch-stats',{ detail:{ ids:${JSON.stringify(items.map(i=>i.id))} }}));` }}
        />
        {items.map(i => (
          <div key={i.id} className="card">
            {/* 缩略图轮播 */}
            {/* Server Component boundary */}
            <ClientCarouselWrapper id={i.id} />
            <div className="card-body">
              <div className="card-title">{i.title}</div>
              <div className="muted">作者：{i.authorName || '-'}</div>
              <div className="mt-3">
                {/* Server-Client boundary */}
                <ClientActionsWrapper id={i.id} initial={statsMap[i.id]} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <a className="btn btn-outline" href={makeHref(Math.max(1, page-1))} aria-disabled={page<=1}>上一页</a>
          <span className="text-sm text-gray-600">第 {page} / {totalPages} 页（共 {total} 条）</span>
          <a className="btn btn-outline" href={makeHref(Math.min(totalPages, page+1))} aria-disabled={page>=totalPages}>下一页</a>
        </div>
      )}
    </div>
  )
}

// 轻量包装以在服务端组件中插入客户端组件
function ClientCarouselWrapper({ id }: { id: string }) {
  const Carousel = require('./ScriptImagesCarousel').default as (p: { id: string }) => JSX.Element
  return <Carousel id={id} />
}

function ClientActionsWrapper({ id, initial }: { id: string; initial?: { likes:number; favorites:number; liked:boolean; favorited:boolean } }) {
  const Actions = require('./ScriptCardActions').default as (p: { id: string; initial?: { likes:number; favorites:number; liked:boolean; favorited:boolean } }) => JSX.Element
  return <Actions id={id} initial={initial} />
}
