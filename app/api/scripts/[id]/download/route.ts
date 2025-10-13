import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/db/client'
import { notFound } from '@/src/api/http'
import { invalidateCache } from '@/src/cache/api-cache'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  let { id } = await context.params
  // 移除 .json 后缀（如果存在），支持 RESTful 风格的 URL
  id = id.replace(/\.json$/, '')
  const [script, v] = await Promise.all([
    prisma.script.findUnique({ where: { id }, select: { title: true } }),
    prisma.scriptJSON.findFirst({ where: { scriptId: id }, orderBy: { createdAt: 'desc' } })
  ])
  if (!v) return notFound()
  let obj: unknown = null
  try { obj = JSON.parse(v.content) } catch { obj = null }
  
  // 记录下载事件并清除下载榜缓存
  const ua = req.headers.get('user-agent') || undefined
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
  prisma.downloadEvent.create({ data: { scriptId: id, ip, userAgent: ua } })
    .then(() => {
      // 清除下载榜缓存（下载影响排行榜）
      invalidateCache('leaderboard-downloads')
    })
    .catch(()=>{})

  const res = NextResponse.json(obj)
  const filename = encodeURIComponent(((script?.title ?? 'script')) + '.json')
  res.headers.set('Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
  return res
}
