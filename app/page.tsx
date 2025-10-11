import HeroSection from './_components/HeroSection'
import HotCarousel from './_components/HotCarousel'
import FeaturesGrid from './_components/FeaturesGrid'
import { prisma } from '@/src/db/client'

// 强制动态渲染，不在构建时预渲染
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchHot() {
  // 直接 SSR 聚合近7天下载 Top5，减少 /api 跳转
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const groups = await prisma.downloadEvent.groupBy({
    by: ['scriptId'],
    where: { createdAt: { gte: since } },
    _count: { scriptId: true },
    orderBy: { _count: { scriptId: 'desc' } },
    take: 5,
  })
  const ids = groups.map(g => g.scriptId)
  if (ids.length) {
    const scripts = await prisma.script.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { path: true } } }
    })
    const map = new Map(scripts.map(s => [s.id, s]))
    return groups.map(g => {
      const s = map.get(g.scriptId)
      const cover = s?.images?.[0]?.path ? `/api/files?path=${encodeURIComponent(s.images[0].path)}` : undefined
      return { scriptId: g.scriptId, title: s?.title || '', downloads: g._count.scriptId, cover }
    })
  }

  // Fallback：若近 7 天无下载数据，则取最近发布 Top5
  const latest = await prisma.script.findMany({
    where: { state: 'published' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { path: true } } }
  })
  return latest.map(s => ({
    scriptId: s.id,
    title: s.title,
    downloads: 0,
    cover: s.images?.[0]?.path ? `/api/files?path=${encodeURIComponent(s.images[0].path)}` : undefined
  }))
}

export default async function HomePage() {
  const hot = await fetchHot()
  return (
    <>
      {/* Hero 区域 - 独立于主容器，真正全屏 */}
      <div className="relative -mx-4 sm:-mx-6 -my-3 sm:-my-4 mb-8 sm:mb-12 md:mb-16">
        <HeroSection />
      </div>
      
      {/* 其他内容 - 在主容器约束内 */}
      <div className="space-y-8 sm:space-y-12 md:space-y-16">
        {!!hot.length && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-surface-on mb-2 sm:mb-3">
                热门剧本
              </h2>
              <p className="text-sm sm:text-base text-surface-on-variant max-w-2xl mx-auto px-4">
                探索近期最受欢迎的剧本内容
              </p>
            </div>
            <HotCarousel items={hot} />
          </div>
        )}
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-6 sm:pb-8">
          <FeaturesGrid />
        </div>
      </div>
    </>
  );
}
