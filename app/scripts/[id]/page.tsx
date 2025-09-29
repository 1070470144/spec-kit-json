type Detail = { id: string; title: string; state: string; images: { id: string; url: string }[]; json?: unknown }

async function fetchDetail(id: string) {
  const res = await fetch(`http://localhost:3000/api/scripts/${id}`, { cache: 'no-store' })
  const j = await res.json()
  const data = (j?.data ?? j) as Detail
  return { data }
}

export default async function ScriptDetailPage({ params }: { params: { id: string } }) {
  const { data } = await fetchDetail(params.id)
  const images = data.images ?? []
  const json = data.json ?? null
  return (
    <div className="container-page section">
      <h1 className="text-2xl font-semibold">{data.title}</h1>
      <div className="muted">状态：{data.state}</div>

      <div className="flex gap-2">
        <form action={`/api/scripts/${data.id}/submit`} method="post">
          <button className="btn btn-outline" type="submit">提交审核</button>
        </form>
        <form action={`/api/scripts/${data.id}/review`} method="post">
          <input type="hidden" name="decision" value="approved" />
          <button className="btn btn-primary" type="submit">审核通过</button>
        </form>
        <form action={`/api/scripts/${data.id}/review`} method="post">
          <input type="hidden" name="decision" value="rejected" />
          <button className="btn btn-danger" type="submit">驳回</button>
        </form>
      </div>

      <form action={`/api/scripts/${data.id}/images`} method="post" encType="multipart/form-data" className="flex gap-2 items-center">
        <input className="input" type="file" name="files" multiple />
        <button className="btn btn-outline" type="submit">上传图片</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map(img => (
          <img key={img.id} src={img.url} alt={data.title} className="rounded border bg-white" />
        ))}
      </div>
      <div className="card">
        <div className="card-body">
          <div className="card-title">JSON</div>
          <pre className="overflow-auto text-sm">{JSON.stringify(json, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
