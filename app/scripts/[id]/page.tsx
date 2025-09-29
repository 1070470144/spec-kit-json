type Detail = { id: string; title: string; author?: string | null; state: string; images: { id: string; url: string }[]; json?: unknown }

async function fetchDetail(id: string) {
  const res = await fetch(`http://localhost:3000/api/scripts/${id}`, { cache: 'no-store' })
  const j = await res.json()
  const data = (j?.data ?? j) as Detail
  return { data }
}

export default async function ScriptDetailPage({ params }: { params: { id: string } }) {
  const { data } = await fetchDetail(params.id)
  const images = data.images ?? []
  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">{data.title}</h1>
      <div className="muted">作者：{data.author || '-'}</div>
      <div className="muted">状态：{data.state}</div>

      <div className="flex gap-2 my-2">
        <a className="btn btn-outline" href={`/api/scripts/${data.id}/download`} download>
          下载 JSON
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map(img => (
          <img key={img.id} src={img.url} alt={data.title} className="rounded border bg-white" />
        ))}
      </div>
    </div>
  )
}
