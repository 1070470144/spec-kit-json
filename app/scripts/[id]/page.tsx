import { headers } from 'next/headers'

type Detail = { id: string; title: string; author?: string | null; state: string; images: { id: string; url: string; isCover?: boolean }[]; json?: unknown }

async function fetchDetail(id: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/scripts/${id}`, { cache: 'no-store' })
  const j = await res.json()
  const data = (j?.data ?? j) as Detail
  return { data, base }
}

export default async function ScriptDetailPage({ params }: { params: { id: string } }) {
  const { data, base } = await fetchDetail(params.id)
  const images = data.images ?? []
  const cover = images.find(i=>i.isCover) || images[0]
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="card-title">{data.title}</div>
              <div className="muted">作者：{data.author || '-'}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full border ${data.state==='pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : data.state==='approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{data.state}</span>
              <a className="btn btn-outline" href={`${base}/api/scripts/${data.id}/download`} download>下载 JSON</a>
              <a className="btn btn-outline" href={`/scripts`}>返回列表</a>
            </div>
          </div>

          {cover?.url && (
            <div className="mt-4">
              <img src={cover.url} alt={data.title} className="w-full max-h-[420px] object-cover rounded-lg border" />
            </div>
          )}

          {!!images.length && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map(img => (
                <img key={img.id} src={img.url} alt={data.title} className="rounded border bg-white object-cover w-full h-28" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
