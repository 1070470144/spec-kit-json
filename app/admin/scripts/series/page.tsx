async function fetchSeries() {
  const res = await fetch('http://localhost:3000/api/admin/scripts/series', { cache: 'no-store' })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string; state: string; versions: number; images: number }[]
  return { items }
}

export default async function AdminSeriesPage() {
  const { items } = await fetchSeries()
  return (
    <div className="container-page section" data-admin>
      <div className="card">
        <div className="card-title">系列管理</div>
        {!items?.length && <div className="muted">暂无系列</div>}
        {!!items?.length && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map(s => (
              <div key={s.id} className="card">
                <div className="card-body">
                  <div className="font-medium">{s.title}</div>
                  <div className="muted">状态：{s.state} · 版本：{s.versions} · 图片：{s.images}</div>
                  <div className="card-actions">
                    <a className="btn btn-outline" href={`/scripts/${s.id}`}>查看</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


