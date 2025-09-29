import { headers, cookies } from 'next/headers'
import UserAnalyticsCharts from '../../_components/UserAnalyticsCharts'

async function fetchStats() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const cookieHeader = (await cookies()).getAll().map(c => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${base}/api/admin/analytics/users`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  const j = await res.json().catch(()=>({}))
  return { data: j?.data || j }
}

function formatIp(ip: string | null | undefined): string {
  const v = (ip || '').trim()
  if (!v) return '-'
  const lower = v.toLowerCase()
  if (lower === '::1') return '本机(IPv6)'
  if (v === '127.0.0.1') return '本机'
  if (v.startsWith('10.')) return '内网(10.x)'
  if (v.startsWith('192.168.')) return '内网(192.168.x)'
  if (v.startsWith('172.')) {
    const b = Number(v.split('.')[1] || '0')
    if (b >= 16 && b <= 31) return '内网(172.16-31.x)'
  }
  return v
}

export default async function AdminUserAnalyticsPage() {
  const { data } = await fetchStats()
  const topRegions = data?.topRegions || []
  const lastLogins = data?.lastLogins || []
  const trend = data?.trend || []
  const kpis = {
    totalUsers: data?.totalUsers ?? 0,
    loginCount: data?.loginCount ?? 0,
    registerCount: data?.registerCount ?? 0,
    activeToday: data?.activeToday ?? 0,
  }
  return (
    <div className="container-page section">
      <div className="card">
        <div className="card-body">
          <div className="card-title">用户分析</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-2">
            <Kpi label="总用户" value={kpis.totalUsers} />
            <Kpi label="登录次数(期)" value={kpis.loginCount} />
            <Kpi label="注册数(期)" value={kpis.registerCount} />
            <Kpi label="今日活跃" value={kpis.activeToday} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium mb-2">IP 地域 Top5</div>
              <div className="space-y-2">
                {topRegions.map((r: any) => (
                  <div key={r.region} className="flex items-center gap-3">
                    <div className="w-28 text-sm text-gray-600">{r.region || '未知'}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded">
                      <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.min(100, r.ratio)}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm">{r.count}</div>
                  </div>
                ))}
                {!topRegions.length && <div className="muted">暂无数据</div>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">最近登录</div>
              <div className="subtitle mb-2">展示近期用户登录记录（邮箱 / 地域 / 来源IP / 时间）。地域为本机、内网或公网网段的近似归类。</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="text-left font-medium pb-1 pr-2">邮箱</th>
                      <th className="text-left font-medium pb-1 pr-2">地域</th>
                      <th className="text-left font-medium pb-1 pr-2">来源IP</th>
                      <th className="text-left font-medium pb-1">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastLogins.map((l: any) => (
                      <tr key={l.id} className="border-t">
                        <td className="py-1 pr-2 truncate max-w-[14rem]" title={l.email}>{l.email}</td>
                        <td className="py-1 pr-2" title={l.region}>{l.region || '-'}</td>
                        <td className="py-1 pr-2" title={l.ip}>{formatIp(l.ip)}</td>
                        <td className="py-1 text-gray-600">{new Date(l.time).toLocaleString()}</td>
                      </tr>
                    ))}
                    {!lastLogins.length && (
                      <tr>
                        <td colSpan={4} className="py-2 text-center muted">暂无数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="md:col-span-2">
              <UserAnalyticsCharts topRegions={topRegions} trend={trend} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}


