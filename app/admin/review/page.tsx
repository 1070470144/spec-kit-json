async function fetchPending() {
  const res = await fetch('http://localhost:3000/api/scripts?state=pending', { cache: 'no-store' })
  const j = await res.json()
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string }[]
  return { items }
}

export default async function ReviewPage() {
  const { items } = await fetchPending()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">待审核</h1>
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i.id} className="p-3 rounded border bg-white">
            <a className="text-blue-600" href={`/scripts/${i.id}`}>{i.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
