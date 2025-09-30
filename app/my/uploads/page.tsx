import { headers, cookies } from 'next/headers'
import ScriptImagesCarousel from '@/app/scripts/ScriptImagesCarousel'

type Item = { id: string; title: string; state: string; createdAt?: string }

async function fetchMyUploads(page = 1, pageSize = 24) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const qs = new URLSearchParams({ mine: '1', page: String(page), pageSize: String(pageSize) })
  const res = await fetch(`${base}/api/scripts?${qs.toString()}`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  const items = (j?.data?.items ?? j?.items ?? []) as Item[]
  const total = Number(j?.data?.total ?? j?.total ?? 0)
  return { items, total, page, pageSize }
}

export default async function MyUploadsPage({ searchParams }: { searchParams?: { page?: string } }) {
  const sp = searchParams
  const pageNum = Math.max(1, Number(sp?.page || '1'))
  const { items, total, page, pageSize } = await fetchMyUploads(pageNum, 24)
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const makeHref = (p: number) => `/my/uploads?${new URLSearchParams({ page: String(p) }).toString()}`
  return (
    <div className="container-page section">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold">我的上传</h1>
      </div>
      <div className="grid-cards">
        {(!items || items.length === 0) && (
          <div className="muted">暂无记录</div>
        )}
        {items && items.length > 0 && items.map(s => (
          <div key={s.id} className="card">
            {/* Server Component boundary */}
            <ClientCarouselWrapper id={s.id} />
            <div className="card-body">
              <div className="card-title flex items-center justify-between">
                <span className={s.state==='abandoned' ? 'line-through text-gray-500' : ''}>{s.title}</span>
                <span className="text-xs px-2 py-0.5 rounded border text-gray-600">{s.state || '-'}</span>
              </div>
              <div className="card-actions">
                <a className="btn btn-outline" href={`/scripts/${s.id}`}>查看详情</a>
                <form className="inline" action={async () => {
                  'use server'
                  const h = await headers()
                  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
                  const proto = h.get('x-forwarded-proto') || 'http'
                  const base = `${proto}://${host}`
                  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
                  await fetch(`${base}/api/scripts/${s.id}/delete`, { method: 'POST', headers: { cookie: cookieHeader } })
                }}>
                  <button className="btn btn-danger" type="submit">删除</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <a className="btn btn-outline" href={makeHref(Math.max(1, page-1))} aria-disabled={page<=1}>上一页</a>
          <span className="text-sm text-gray-600">第 {page} / {totalPages} 页（共 {total} 条）</span>
          <a className="btn btn-outline" href={makeHref(Math.min(totalPages, page+1))} aria-disabled={page>=totalPages}>下一页</a>
        </div>
      )}
    </div>
  )
}

// 复用剧本图片轮播
function ClientCarouselWrapper({ id }: { id: string }) {
  const Carousel = require('../../scripts/ScriptImagesCarousel').default as (p: { id: string }) => JSX.Element
  return <Carousel id={id} />
}


