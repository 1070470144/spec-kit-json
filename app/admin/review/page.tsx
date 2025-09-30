import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import ReviewItem from '../_components/ReviewItem'

async function fetchByState(state: string, page = 1, pageSize = 50) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/scripts?state=${encodeURIComponent(state)}&page=${page}&pageSize=${pageSize}`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as { id: string; title: string }[]
  const total = j?.data?.total ?? j?.total ?? items.length
  return { items, total }
}

export default async function ReviewPage({ searchParams }: { searchParams?: { page?: string } }) {
  const sp = searchParams
  const page = Math.max(1, Number(sp?.page || '1'))
  const pageSize = 50
  const { items: pending, total } = await fetchByState('pending', page, pageSize)
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">剧本审核</div>
          <div className="mb-3">
            <form action={async () => {
              'use server'
              const h = await headers()
              const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
              const proto = h.get('x-forwarded-proto') || 'http'
              const base = `${proto}://${host}`
              const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
              await fetch(`${base}/api/admin/review/approve-all`, { method: 'POST', headers: { cookie: cookieHeader } })
              revalidatePath('/admin/review')
            }}>
              <button className={`btn ${pending && pending.length ? 'btn-primary' : 'btn-outline'} `} type="submit" disabled={!pending || pending.length === 0}>一键通过全部待审核</button>
            </form>
          </div>
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
          {total > pageSize && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <a className={`btn btn-outline ${page<=1?'opacity-60 pointer-events-none':''}`} href={`/admin/review?page=${Math.max(1,page-1)}`}>上一页</a>
              <span className="muted">第 {page} 页 / 共 {Math.ceil(total/pageSize)} 页</span>
              <a className={`btn btn-outline ${page>=Math.ceil(total/pageSize)?'opacity-60 pointer-events-none':''}`} href={`/admin/review?page=${page+1}`}>下一页</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
