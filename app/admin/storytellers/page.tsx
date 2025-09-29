import { headers, cookies } from 'next/headers'

async function fetchApps() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/admin/storytellers`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  return { items: j?.data?.items || j?.items || [] }
}

export default async function AdminStorytellersPage() {
  const { items } = await fetchApps()
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">说书人认证</div>
          {(!items || items.length===0) && <div className="muted">暂无申请</div>}
          {!!items?.length && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((it:any) => (
                <div key={it.id} className="card">
                  <div className="card-body">
                    <div className="font-medium">{it.user?.email || '-'}</div>
                    <img src={it.imageUrl} alt="申请图片" className="mt-2 w-full h-40 object-contain rounded border" />
                    <div className="card-actions">
                      <form action={`${it.approve1}`} method="post"><button className="btn btn-outline" type="submit">一星通过</button></form>
                      <form action={`${it.approve2}`} method="post"><button className="btn btn-primary" type="submit">二星通过</button></form>
                      <form action={`/api/admin/storytellers/reject`} method="post" className="flex items-center gap-2">
                        <input className="input" name="reason" placeholder="拒绝原因" />
                        <input type="hidden" name="id" value={it.id} />
                        <button className="btn btn-danger" formAction={`/api/admin/storytellers/reject?id=${encodeURIComponent(it.id)}&reason=`} type="submit">拒绝</button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


