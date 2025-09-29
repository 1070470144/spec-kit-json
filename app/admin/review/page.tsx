import { headers, cookies } from 'next/headers'
import ReviewItem from '../_components/ReviewItem'

async function fetchByState(state: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/scripts?state=${encodeURIComponent(state)}&page=1&pageSize=50`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string }[]
  return items
}

export default async function ReviewPage() {
  const [pending] = await Promise.all([fetchByState('pending')])
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">剧本审核</div>
          {(!pending || pending.length === 0) && (
            <div className="muted">暂无待审核的剧本</div>
          )}
          {pending && pending.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pending.map(i => (
                <ReviewItem key={i.id} id={i.id} title={i.title} author={(i as any).authorName} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
