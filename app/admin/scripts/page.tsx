import { headers, cookies } from 'next/headers'

async function fetchScripts() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/scripts?page=1&pageSize=50`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id:string; title:string; state?:string }[]
  return { items }
}

export default async function AdminScriptsManagePage() {
  const { items } = await fetchScripts()
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">剧本列表</div>
        {!items?.length && <div className="muted">暂无剧本</div>}
        {!!items?.length && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map(s => (
                <div key={s.id} className="card">
                  <div className="card-body">
                    <div className="font-medium">{s.title}</div>
                    <div className="muted">状态：{s.state || '-'}</div>
                    <div className="card-actions">
                      <a className="btn btn-outline" href={`/scripts/${s.id}`}>查看</a>
                      <a className="btn btn-primary" href={`/admin/review`}>去审核</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}
        </div>
      </div>
    </div>
  )
}
