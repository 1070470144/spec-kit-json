import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, unauthorized } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'

function ipv4Region(ip: string): { label: string; group: string } {
  const parts = ip.split('.')
  const a = Number(parts[0] || '0'), b = Number(parts[1] || '0')
  if (ip === '127.0.0.1') return { label: '本机', group: 'loopback' }
  if (a === 10) return { label: '内网(10.x)', group: '10.x' }
  if (a === 192 && b === 168) return { label: '内网(192.168.x)', group: '192.168' }
  if (a === 172 && b >= 16 && b <= 31) return { label: '内网(172.16-31.x)', group: '172.16-31' }
  const group = `${a}.${b}.*`
  return { label: `公网 ${group}`, group }
}

function ipv6Region(ip: string): { label: string; group: string } {
  const lower = ip.toLowerCase()
  if (lower === '::1') return { label: '本机(IPv6)', group: 'loopback6' }
  if (lower.startsWith('fc') || lower.startsWith('fd')) return { label: '内网(IPv6 ULA)', group: 'ula6' }
  if (lower.startsWith('fe80')) return { label: '链路本地(IPv6)', group: 'linklocal6' }
  const head = lower.split(':')[0]
  return { label: `公网 ${head}::*`, group: `${head}::*` }
}

function ipToRegion(ipRaw: string | null | undefined): { label: string; group: string } {
  const ip = (ipRaw || '').trim()
  if (!ip) return { label: '未知', group: 'unknown' }
  if (ip.includes('.')) return ipv4Region(ip)
  if (ip.includes(':')) return ipv6Region(ip)
  return { label: '未知', group: 'unknown' }
}

export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')

  const { searchParams } = new URL(req.url)
  const daysParam = Number(searchParams.get('days') || '14')
  const days = Math.max(1, Math.min(90, isNaN(daysParam) ? 14 : daysParam))
  const since = new Date(Date.now() - days * 24 * 3600 * 1000)

  const logs = await prisma.auditLog.findMany({
    where: { action: { in: ['admin_login','user_login','user_register'] }, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 1000
  })

  // 简单地域统计（以 IP 前缀/段替代，可接第三方 IP 库增强）
  const regionCount = new Map<string, { label: string; count: number }>()
  for (const l of logs) {
    const { label, group } = ipToRegion(l.ip)
    const cur = regionCount.get(group)
    regionCount.set(group, { label, count: (cur?.count || 0) + 1 })
  }
  const top = Array.from(regionCount.values()).map(r => ({ region: r.label, count: r.count }))
    .sort((a,b)=>b.count-a.count).slice(0,5)
  const max = Math.max(1, ...top.map(t=>t.count))
  const topRegions = top.map(t => ({ ...t, ratio: Math.round(t.count / max * 100) }))

  // 最近登录列表（示例从日志中重建邮箱关联，如需要可在写日志时保存 email）
  const userIds = Array.from(new Set(logs.map(l=>l.actorId).filter(Boolean) as string[]))
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } })
  const id2email = new Map(users.map(u=>[u.id, u.email]))
  const lastLogins = logs.filter(l=>l.action==='user_login').slice(0, 20).map(l => ({ id: l.id, email: id2email.get(l.actorId || '') || '未知', region: ipToRegion(l.ip).label, ip: l.ip, time: l.createdAt }))

  // 按天统计趋势（最近 14 天）
  const dayList = Array.from({ length: 14 }).map((_,i)=>{
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    d.setHours(0,0,0,0)
    return d
  })
  const dayKey = (d: Date) => d.toISOString().slice(0,10)
  const loginSeries: Record<string, number> = {}
  const registerSeries: Record<string, number> = {}
  for (const d of dayList) { loginSeries[dayKey(d)] = 0; registerSeries[dayKey(d)] = 0 }
  for (const l of logs) {
    const k = dayKey(new Date(l.createdAt))
    if (k in loginSeries && l.action === 'user_login') loginSeries[k]++
    if (k in registerSeries && l.action === 'user_register') registerSeries[k]++
  }
  const trend = dayList.map(d => ({ date: dayKey(d), login: loginSeries[dayKey(d)], register: registerSeries[dayKey(d)] }))

  // 汇总 KPI
  const [totalUsers, loginCount, registerCount] = await Promise.all([
    prisma.user.count(),
    prisma.auditLog.count({ where: { action: 'user_login', createdAt: { gte: since } } }),
    prisma.auditLog.count({ where: { action: 'user_register', createdAt: { gte: since } } })
  ])
  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
  const activeTodayIds = await prisma.auditLog.findMany({ where: { action: 'user_login', createdAt: { gte: startOfToday } }, distinct: ['actorId'], select: { actorId: true } })
  const activeToday = activeTodayIds.length

  return ok({ topRegions, lastLogins, trend, totalUsers, loginCount, registerCount, activeToday })
}


