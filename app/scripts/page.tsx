import { headers } from 'next/headers'

async function fetchList(page = 1, pageSize = 24, q?: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const qs = new URLSearchParams({ state: 'published', page: String(page), pageSize: String(pageSize), ...(q ? { q } : {}) })
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
  
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  
  // 批量预取当前页的点赞/收藏统计
  let statsMap: Record<string, { likes:number; favorites:number; liked:boolean; favorited:boolean }> = {}
  try {
    const res = await fetch(`${base}/api/scripts/stats-batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: items.map(i=>i.id) }) })
    const j = await res.json().catch(()=>({}))
    statsMap = (j?.data?.items ?? j?.items ?? {}) as typeof statsMap
  } catch {}
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/scripts?${new URLSearchParams({ page: String(p), ...(q ? { q } : {}) }).toString()}`
  return (
    <div className="container-page section">
      <h1 className="text-headline-small mb-6 text-surface-on">剧本列表</h1>
      <form className="flex gap-3 mb-6" action="/scripts" method="get">
        <input 
          className="input flex-1" 
          name="q" 
          placeholder="搜索剧本标题..." 
          defaultValue={q}
          aria-label="搜索剧本"
        />
        {/* 重置到第 1 页 */}
        <input type="hidden" name="page" value="1" />
        <button className="m3-btn-filled" type="submit">搜索</button>
        {q && <a className="m3-btn-text" href="/scripts">清除</a>}
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 预取当前页所有脚本的统计，子组件从缓存读取，避免 N 次独立请求 */}
        <script
          dangerouslySetInnerHTML={{ __html: `window.dispatchEvent(new CustomEvent('scripts:prefetch-stats',{ detail:{ ids:${JSON.stringify(items.map(i=>i.id))} }}));` }}
        />
        {items.map(i => (
          <div key={i.id} className="m3-card-elevated overflow-hidden">
            {/* 缩略图轮播 */}
            <ClientCarouselWrapper id={i.id} />
            <div className="p-4">
              <div className="text-title-large mb-1 text-surface-on">{i.title}</div>
              <div className="text-body-small text-surface-on-variant mb-3">作者：{i.authorName || '-'}</div>
              <ClientActionsWrapper id={i.id} initial={statsMap[i.id]} />
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <a 
            className={`m3-btn-outlined ${page<=1 ? 'opacity-60 pointer-events-none' : ''}`}
            href={makeHref(Math.max(1, page-1))} 
            aria-disabled={page<=1}
          >
            上一页
          </a>
          <span className="text-body-medium text-surface-on-variant">
            第 {page} / {totalPages} 页（共 {total} 条）
          </span>
          <a 
            className={`m3-btn-outlined ${page>=totalPages ? 'opacity-60 pointer-events-none' : ''}`}
            href={makeHref(Math.min(totalPages, page+1))} 
            aria-disabled={page>=totalPages}
          >
            下一页
          </a>
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
