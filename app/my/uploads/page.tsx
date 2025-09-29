import { headers, cookies } from 'next/headers'
import ScriptImagesCarousel from '@/app/scripts/ScriptImagesCarousel'

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
            {/* @ts-expect-error Server Component boundary */}
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
    </div>
  )
}

// 复用剧本图片轮播
function ClientCarouselWrapper({ id }: { id: string }) {
  const Carousel = require('../../scripts/ScriptImagesCarousel').default as (p: { id: string }) => JSX.Element
  return <Carousel id={id} />
}


