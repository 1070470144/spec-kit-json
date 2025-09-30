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
    <div className="container-page section">
      {/* Client component */}
      <ScriptsAnalyticsCharts downloads={dls} likes={likes} favorites={favs} />
    </div>
  )
}

// 图表渲染移至 ScriptsAnalyticsCharts（Client 组件）


