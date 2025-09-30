import { headers, cookies } from 'next/headers'
import AdminScriptItem from '../_components/AdminScriptItem'
import DeleteAllScriptsButton from '../_components/DeleteAllScriptsButton'

async function fetchScripts(state?: string, page = 1, pageSize = 24) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(state ? { state } : {}) })
  const res = await fetch(`${base}/api/scripts?${qs.toString()}`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id:string; title:string; state?:string; authorName?: string | null }[]
  const total = Number(j?.data?.total ?? j?.total ?? 0)
  return { items, total, page, pageSize }
}

export default async function AdminScriptsManagePage({ searchParams }: { searchParams?: Promise<{ state?: string; page?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const state = sp?.state || 'pending'  // 默认显示待审核
  const pageNum = Math.max(1, Number(sp?.page || '1'))
  const { items, total, page, pageSize } = await fetchScripts(state, pageNum)
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/admin/scripts?${new URLSearchParams({ state, page: String(p) }).toString()}`
  
  // 状态配置
  const states = [
    { value: 'pending', label: '待审核', emptyText: '暂无待审核的剧本' },
    { value: 'published', label: '已通过', emptyText: '还没有已发布的剧本' },
    { value: 'rejected', label: '已拒绝', emptyText: '没有已拒绝的剧本' },
    { value: 'abandoned', label: '已废弃', emptyText: '没有已废弃的剧本' },
  ]
  
  const currentState = states.find(s => s.value === state) || states[0]
  
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-headline-medium font-semibold text-surface-on">剧本列表</h1>
              <p className="text-body-small text-surface-on-variant mt-1">
                管理所有剧本，查看不同状态的剧本
              </p>
            </div>
            <DeleteAllScriptsButton />
          </div>

          <div className="mb-6 inline-flex rounded-sm border border-outline overflow-hidden" role="group" aria-label="状态筛选">
            {states.map((s, idx) => (
              <a 
                key={s.value}
                className={`m3-segmented-btn ${state === s.value ? 'm3-segmented-btn-active' : ''}`}
                href={`/admin/scripts?state=${s.value}`}
                aria-current={state === s.value ? 'page' : undefined}
              >
                {s.label}
              </a>
            ))}
          </div>

          {!items?.length && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-title-medium font-medium text-surface-on mb-1">
                暂无剧本
              </div>
              <div className="text-body-small text-surface-on-variant">
                {currentState.emptyText}
              </div>
            </div>
          )}

          {!!items?.length && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(s => (
                <AdminScriptItem key={s.id} item={s} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <a 
                className={`m3-btn-outlined ${page<=1?'opacity-60 pointer-events-none':''}`} 
                href={makeHref(Math.max(1, page-1))}
                aria-label="上一页"
                aria-disabled={page<=1}
              >
                上一页
              </a>
              <span className="text-body-medium text-surface-on-variant px-4">
                第 {page} / {totalPages} 页 · 共 {total} 条
              </span>
              <a 
                className={`m3-btn-outlined ${page>=totalPages?'opacity-60 pointer-events-none':''}`} 
                href={makeHref(Math.min(totalPages, page+1))}
                aria-label="下一页"
                aria-disabled={page>=totalPages}
              >
                下一页
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
