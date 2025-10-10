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
    <div className="container-page section space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-surface-on mb-3 sm:mb-4">剧本列表</h1>
        <p className="text-base sm:text-lg text-surface-on-variant max-w-2xl mx-auto px-4">
          探索丰富的剧本资源库，找到最适合你的剧本
        </p>
      </div>
      
      <form className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto" action="/scripts" method="get">
        <div className="relative flex-1">
          <input 
            className="input w-full pl-10 sm:pl-12 text-base min-h-touch" 
            name="q" 
            placeholder="搜索剧本标题..." 
            defaultValue={q}
            aria-label="搜索剧本"
          />
          <svg className="w-5 h-5 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input type="hidden" name="page" value="1" />
        <div className="flex gap-3">
          <button className="m3-btn-filled flex-1 sm:flex-none min-h-touch" type="submit">搜索</button>
          {q && <a className="m3-btn-outlined flex-1 sm:flex-none min-h-touch" href="/scripts">清除</a>}
        </div>
      </form>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* 预取当前页所有脚本的统计，子组件从缓存读取，避免 N 次独立请求 */}
        <script
          dangerouslySetInnerHTML={{ __html: `window.dispatchEvent(new CustomEvent('scripts:prefetch-stats',{ detail:{ ids:${JSON.stringify(items.map(i=>i.id))} }}));` }}
        />
        {items.map(i => (
          <div key={i.id} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500"></div>
            
            {/* 缩略图轮播 */}
            <ClientCarouselWrapper id={i.id} />
            
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-surface-on group-hover:text-sky-600 transition-colors line-clamp-2">{i.title}</h3>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-surface-on-variant mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>作者：{i.authorName || '未知'}</span>
              </div>
              <ClientActionsWrapper id={i.id} initial={statsMap[i.id]} />
            </div>
            
            {/* 悬浮边框 */}
            <div className="absolute inset-0 border-2 border-sky-500/0 group-hover:border-sky-500/20 rounded-2xl transition-all duration-500 pointer-events-none"></div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a 
            className={`m3-btn-outlined min-h-touch w-full sm:w-auto ${page<=1 ? 'opacity-60 pointer-events-none' : ''}`}
            href={makeHref(Math.max(1, page-1))} 
            aria-disabled={page<=1}
            aria-label="上一页"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一页
          </a>
          <span className="text-sm sm:text-base font-medium text-surface-on-variant px-4 sm:px-6 py-2">
            第 {page} / {totalPages} 页
            <span className="hidden sm:inline"> · 共 {total} 条</span>
          </span>
          <a 
            className={`m3-btn-outlined min-h-touch w-full sm:w-auto ${page>=totalPages ? 'opacity-60 pointer-events-none' : ''}`}
            href={makeHref(Math.min(totalPages, page+1))} 
            aria-disabled={page>=totalPages}
            aria-label="下一页"
          >
            下一页
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
