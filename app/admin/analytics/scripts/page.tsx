import { headers, cookies } from 'next/headers'
import ScriptsAnalyticsCharts from '../../_components/ScriptsAnalyticsCharts'

async function fetchData() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/admin/analytics/scripts`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  return { data: j?.data || j }
}

export default async function AdminScriptsAnalyticsPage() {
  const { data } = await fetchData()
  const dls = data?.topDownloads || []
  const likes = data?.topLikes || []
  const favs = data?.topFavorites || []
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-headline-medium font-semibold text-surface-on mb-1">剧本分析</h1>
        <p className="text-body-small text-surface-on-variant">
          查看最受欢迎的剧本：下载、点赞和收藏排行榜
        </p>
      </div>

      {/* 图表组件 */}
      <ScriptsAnalyticsCharts downloads={dls} likes={likes} favorites={favs} />
    </div>
  )
}

// 图表渲染移至 ScriptsAnalyticsCharts（Client 组件）


