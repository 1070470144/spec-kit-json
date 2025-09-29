import { headers, cookies } from 'next/headers'

type Item = { id: string; title: string; state: string; createdAt?: string }

async function fetchMyUploads() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/scripts?mine=1`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as Item[]
  return { items }
}

export default async function MyUploadsPage() {
  const { items } = await fetchMyUploads()
  return (
    <div className="container-page section">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold">我的上传</h1>
        <p className="subtitle mt-1">记录你提交的所有剧本，便于查看状态与跳转详情。</p>
      </div>
      <div className="grid-cards">
        {(!items || items.length === 0) && (
          <div className="muted">暂无记录</div>
        )}
        {items && items.length > 0 && items.map(s => (
          <div key={s.id} className="card">
            <div className="card-body">
              <div className="card-title">{s.title}</div>
              <div className="muted">状态：{s.state || '-'}</div>
              <div className="card-actions">
                <a className="btn btn-outline" href={`/scripts/${s.id}`}>查看详情</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


