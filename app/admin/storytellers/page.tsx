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
  
  const pendingCount = items.filter((it: any) => it.status === 'pending').length
  
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-headline-medium font-semibold text-surface-on">讲述者认证</h1>
              <p className="text-body-small text-surface-on-variant mt-1">
                审核用户的讲述者认证申请，设置认证等级
              </p>
            </div>
            {pendingCount > 0 && status !== 'pending' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-body-small font-medium text-orange-800">
                  {pendingCount} 个待审核
                </span>
              </div>
            )}
          </div>

          <div className="mb-6 inline-flex rounded-lg border border-outline overflow-hidden" role="group" aria-label="状态筛选">
            <a 
              className={`px-4 py-2 text-label-large transition-colors ${
                !status 
                  ? 'bg-primary text-primary-on font-medium' 
                  : 'bg-surface text-surface-on hover:bg-surface-variant'
              }`} 
              href="/admin/storytellers"
            >
              全部
            </a>
            <a 
              className={`px-4 py-2 text-label-large border-l border-outline transition-colors ${
                status==='pending' 
                  ? 'bg-primary text-primary-on font-medium' 
                  : 'bg-surface text-surface-on hover:bg-surface-variant'
              }`} 
              href="/admin/storytellers?status=pending"
            >
              待审核
            </a>
            <a 
              className={`px-4 py-2 text-label-large border-l border-outline transition-colors ${
                status==='approved' 
                  ? 'bg-primary text-primary-on font-medium' 
                  : 'bg-surface text-surface-on hover:bg-surface-variant'
              }`} 
              href="/admin/storytellers?status=approved"
            >
              已通过
            </a>
            <a 
              className={`px-4 py-2 text-label-large border-l border-outline transition-colors ${
                status==='rejected' 
                  ? 'bg-primary text-primary-on font-medium' 
                  : 'bg-surface text-surface-on hover:bg-surface-variant'
              }`} 
              href="/admin/storytellers?status=rejected"
            >
              已拒绝
            </a>
          </div>

          {(!items || items.length===0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-title-medium font-medium text-surface-on mb-1">
                暂无申请
              </div>
              <div className="text-body-small text-surface-on-variant">
                {status === 'pending' ? '没有待审核的申请' : 
                 status === 'approved' ? '没有已通过的申请' :
                 status === 'rejected' ? '没有已拒绝的申请' :
                 '还没有讲述者认证申请'}
              </div>
            </div>
          )}

          {!!items?.length && (
            <div className="space-y-3">
              {items.map((it:any) => (
                <div key={it.id} className="border border-outline rounded-lg bg-surface p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <img src={it.imageUrl} alt="认证图片" className="w-32 h-24 object-contain rounded border-2 border-outline" />
                  <div className="flex-1 min-w-0">
                    <div className="text-title-medium font-semibold text-surface-on truncate mb-1">
                      {it.user?.nickname || it.user?.email || '-'}
                    </div>
                    <div className="flex items-center gap-3 text-body-small text-surface-on-variant">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        it.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        it.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {it.status === 'pending' ? '待审核' : 
                         it.status === 'approved' ? '已通过' : 
                         '已拒绝'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                        等级 {it.level}
                      </span>
                    </div>
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


