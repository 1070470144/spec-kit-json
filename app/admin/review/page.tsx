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

export default async function ReviewPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const page = Math.max(1, Number(sp?.page || '1'))
  const pageSize = 50
  const { items: pending, total } = await fetchByState('pending', page, pageSize)
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-headline-medium font-semibold text-surface-on">剧本审核</h1>
              <p className="text-body-small text-surface-on-variant mt-1">
                审核用户提交的剧本，决定是否发布
              </p>
            </div>
            {pending && pending.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                <span className="text-body-small font-medium text-sky-800">
                  {pending.length} 个待审核
                </span>
              </div>
            )}
          </div>

          {pending && pending.length > 0 && (
            <div className="mb-4">
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
                <button className="m3-btn-outlined" type="submit">
                  一键通过全部待审核
                </button>
              </form>
            </div>
          )}

          {(!pending || pending.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-title-medium font-medium text-surface-on mb-1">
                全部审核完成
              </div>
              <div className="text-body-small text-surface-on-variant">
                暂无待审核的剧本
              </div>
            </div>
          )}

          {pending && pending.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pending.map(i => (
                <ReviewItem key={i.id} id={i.id} title={i.title} author={(i as any).authorName} />
              ))}
            </div>
          )}

          {total > pageSize && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <a 
                className={`m3-btn-outlined ${page<=1?'opacity-60 pointer-events-none':''}`} 
                href={`/admin/review?page=${Math.max(1,page-1)}`}
                aria-label="上一页"
              >
                上一页
              </a>
              <span className="text-body-medium text-surface-on-variant px-4">
                第 {page} / {Math.ceil(total/pageSize)} 页
              </span>
              <a 
                className={`m3-btn-outlined ${page>=Math.ceil(total/pageSize)?'opacity-60 pointer-events-none':''}`} 
                href={`/admin/review?page=${page+1}`}
                aria-label="下一页"
              >
                下一页
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
