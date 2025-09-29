async function fetchPending() {
  const res = await fetch('http://localhost:3000/api/scripts?state=pending', { cache: 'no-store' })
  const j = await res.json()
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string }[]
  return { items }
}

export default async function ReviewPage() {
  const { items } = await fetchPending()
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">剧本审核</div>
          {(!items || items.length === 0) && (
            <div className="muted">暂无待审核的剧本</div>
          )}
          {items && items.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map(i => (
                <div key={i.id} className="card">
                  <div className="card-body">
                    <div className="card-title">{i.title}</div>
                    <div className="card-actions">
                      <a className="btn btn-primary" href={`/scripts/${i.id}`}>去审核</a>
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
