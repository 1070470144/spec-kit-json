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
  const state = sp?.state
  const pageNum = Math.max(1, Number(sp?.page || '1'))
  const { items, total, page, pageSize } = await fetchScripts(state, pageNum)
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/admin/scripts?${new URLSearchParams({ ...(state ? { state } : {}), page: String(p) }).toString()}`
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title flex items-center justify-between">
            <span>剧本列表</span>
            {/* 客户端按钮处理确认与请求 */}
            <DeleteAllScriptsButton />
          </div>
          <div className="mb-3 flex items-center gap-2">
            <a className={`btn ${!state ? 'btn-primary' : 'btn-outline'}`} href="/admin/scripts">已发布</a>
            <a className={`btn ${state==='abandoned' ? 'btn-primary' : 'btn-outline'}`} href="/admin/scripts?state=abandoned">仅已废弃</a>
          </div>
        {!items?.length && <div className="muted">暂无剧本</div>}
        {!!items?.length && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map(s => (
                <AdminScriptItem key={s.id} item={s} />
              ))}
            </div>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <a className="btn btn-outline" href={makeHref(Math.max(1, page-1))} aria-disabled={page<=1}>上一页</a>
            <span className="text-sm text-gray-600">第 {page} / {totalPages} 页（共 {total} 条）</span>
            <a className="btn btn-outline" href={makeHref(Math.min(totalPages, page+1))} aria-disabled={page>=totalPages}>下一页</a>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
