async function fetchList() {
  const res = await fetch('http://localhost:3000/api/scripts', { cache: 'no-store' })
  const j = await res.json()
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string }[]
  return { items }
}

export default async function ScriptsPage() {
  const { items } = await fetchList()
  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">剧本列表</h1>
      <div className="grid-cards">
        {items.map(i => (
          <div key={i.id} className="card">
            <div className="card-body">
              <div className="card-title">{i.title}</div>
              <a className="btn btn-outline mt-2" href={`/scripts/${i.id}`}>查看详情</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
