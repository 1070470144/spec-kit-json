import StorytellerLevelButtons from '../_components/StorytellerLevelButtons'
import { headers, cookies } from 'next/headers'

async function fetchApps(status?: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const qs = new URLSearchParams({ ...(status ? { status } : {}) })
  const res = await fetch(`${base}/api/admin/storytellers?${qs.toString()}`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  return { items: j?.data?.items || j?.items || [] }
}

export default async function AdminStorytellersPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const sp = searchParams ? await searchParams : undefined
  const status = sp?.status
  const { items } = await fetchApps(status)
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">说书人认证</div>
          <div className="mb-3 flex items-center gap-2">
            <a className={`btn ${!status ? 'btn-primary' : 'btn-outline'}`} href="/admin/storytellers">全部</a>
            <a className={`btn ${status==='pending' ? 'btn-primary' : 'btn-outline'}`} href="/admin/storytellers?status=pending">待审核</a>
            <a className={`btn ${status==='approved' ? 'btn-primary' : 'btn-outline'}`} href="/admin/storytellers?status=approved">已通过</a>
            <a className={`btn ${status==='rejected' ? 'btn-primary' : 'btn-outline'}`} href="/admin/storytellers?status=rejected">已拒绝</a>
          </div>
          {(!items || items.length===0) && <div className="muted">暂无申请</div>}
          {!!items?.length && (
            <div className="space-y-3">
              {items.map((it:any) => (
                <div key={it.id} className="border rounded-lg bg-white p-3 flex items-center gap-3">
                  <img src={it.imageUrl} alt="申请图片" className="w-28 h-20 object-contain rounded border" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{it.user?.nickname || it.user?.email || '-'}</div>
                    <div className="text-xs text-gray-600">状态：{it.status} · 等级：{it.level}</div>
                  </div>
                  <StorytellerLevelButtons id={it.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


