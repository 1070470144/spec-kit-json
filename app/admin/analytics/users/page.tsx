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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-headline-medium font-semibold text-surface-on mb-1">用户分析</h1>
        <p className="text-body-small text-surface-on-variant">
          查看用户注册、登录和活跃数据趋势
        </p>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="总用户" value={kpis.totalUsers} icon="users" color="sky" />
        <Kpi label="登录次数" value={kpis.loginCount} icon="login" color="cyan" />
        <Kpi label="注册数" value={kpis.registerCount} icon="register" color="emerald" />
        <Kpi label="今日活跃" value={kpis.activeToday} icon="active" color="amber" />
      </div>

      <div className="card">
        <div className="card-body">
          <div className="space-y-6">
            {/* IP 地域分布 */}
            <div>
              <h3 className="text-title-large font-semibold text-surface-on mb-4">IP 地域分布 Top 5</h3>
              <div className="space-y-3">
                {topRegions.map((r: any, index: number) => (
                  <div key={r.region} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-surface-on-variant">#{index + 1}</span>
                        <span className="text-base font-medium text-surface-on">{r.region || '未知'}</span>
                      </div>
                      <span className="text-sm font-semibold text-sky-600">{r.count} 次</span>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-cyan-600 transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, r.ratio)}%` }} 
                      />
                    </div>
                  </div>
                ))}
                {!topRegions.length && (
                  <div className="text-center py-8 text-surface-on-variant">暂无数据</div>
                )}
              </div>
            </div>

            {/* 最近登录记录 */}
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-title-large font-semibold text-surface-on">最近登录记录</h3>
                <p className="text-body-small text-surface-on-variant">
                  展示近期用户登录活动
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="table-admin">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">邮箱</th>
                        <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">地域</th>
                        <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">来源 IP</th>
                        <th className="px-3 py-3 text-body-small font-medium text-surface-on-variant">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastLogins.map((l: any) => (
                        <tr key={l.id}>
                          <td className="px-3 py-3 font-medium text-surface-on truncate max-w-xs" title={l.email}>{l.email}</td>
                          <td className="px-3 py-3 text-body-small text-surface-on-variant" title={l.region}>{l.region || '-'}</td>
                          <td className="px-3 py-3 text-body-small font-mono text-surface-on-variant" title={l.ip}>{formatIp(l.ip)}</td>
                          <td className="px-3 py-3 text-body-small text-surface-on-variant whitespace-nowrap">
                            {new Date(l.time).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                      {!lastLogins.length && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-surface-on-variant">暂无登录记录</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div>
        <UserAnalyticsCharts topRegions={topRegions} trend={trend} />
      </div>
    </div>
  )
}

function Kpi({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorClasses = {
    sky: 'from-sky-500/10 to-cyan-500/20 text-sky-600',
    cyan: 'from-cyan-500/10 to-blue-500/20 text-cyan-600',
    emerald: 'from-emerald-500/10 to-green-500/20 text-emerald-600',
    amber: 'from-amber-500/10 to-orange-500/20 text-amber-600'
  }
  
  const icons = {
    users: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    login: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    ),
    register: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    ),
    active: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    )
  }
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 p-6">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} opacity-50`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="text-body-small font-medium text-surface-on-variant">{label}</div>
          <svg className={`w-6 h-6 ${colorClasses[color as keyof typeof colorClasses].split(' ')[2]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icons[icon as keyof typeof icons]}
          </svg>
        </div>
        <div className="text-4xl font-bold text-surface-on">{value}</div>
      </div>
    </div>
  )
}


