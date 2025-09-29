import { headers, cookies } from 'next/headers'
import AdminScriptItem from '../_components/AdminScriptItem'

async function fetchScripts(state?: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const qs = new URLSearchParams({ page: '1', pageSize: '50', ...(state ? { state } : {}) })
  const res = await fetch(`${base}/api/scripts?${qs.toString()}`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id:string; title:string; state?:string; authorName?: string | null }[]
  return { items }
}

export default async function AdminScriptsManagePage({ searchParams }: { searchParams?: Promise<{ state?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const state = sp?.state
  const { items } = await fetchScripts(state)
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">剧本列表</div>
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
        </div>
      </div>
    </div>
  )
}
