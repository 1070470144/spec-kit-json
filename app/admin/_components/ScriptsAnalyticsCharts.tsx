'use client'
import { useEffect, useRef } from 'react'

export type RankRow = { id: string; title: string; count: number }

export default function ScriptsAnalyticsCharts({
  downloads,
  likes,
  favorites
}: {
  downloads: RankRow[]
  likes: RankRow[]
  favorites: RankRow[]
}) {
  const dlRef = useRef<HTMLCanvasElement | null>(null)
  const likeRef = useRef<HTMLCanvasElement | null>(null)
  const favRef = useRef<HTMLCanvasElement | null>(null)
  const dlChart = useRef<any>(null)
  const likeChart = useRef<any>(null)
  const favChart = useRef<any>(null)

  useEffect(() => {
    async function draw() {
      const mod = await import('chart.js/auto')
      const Chart = (mod as any).default || (mod as any)
      const destroyAll = () => {
        if (dlChart.current) { dlChart.current.destroy(); dlChart.current = null }
        if (likeChart.current) { likeChart.current.destroy(); likeChart.current = null }
        if (favChart.current) { favChart.current.destroy(); favChart.current = null }
      }
      destroyAll()

      const build = (ref: HTMLCanvasElement | null, rows: RankRow[], color: string) => {
        if (!ref || rows.length === 0 || !Chart || typeof Chart !== 'function') return
        const labels = rows.map(r => r.title)
        const data = rows.map(r => r.count)
        const cfg = {
          type: 'bar',
          data: { labels, datasets: [{ label: '数量', data, backgroundColor: color }] },
          options: {
            indexAxis: 'y' as const,
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { beginAtZero: true } },
            plugins: { legend: { display: false } }
          }
        }
        return new Chart(ref.getContext('2d'), cfg as any)
      }

      dlChart.current = build(dlRef.current, downloads, '#0ea5e9')
      likeChart.current = build(likeRef.current, likes, '#06b6d4')
      favChart.current = build(favRef.current, favorites, '#10b981')
    }
    draw()
    return () => {
      if (dlChart.current) dlChart.current.destroy()
      if (likeChart.current) likeChart.current.destroy()
      if (favChart.current) favChart.current.destroy()
    }
  }, [downloads, likes, favorites])

  return (
    <div className="space-y-6">
      {/* 下载 Top10 - 全宽 */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-title-large font-semibold text-surface-on mb-1">下载量排行榜</h3>
              <p className="text-body-small text-surface-on-variant">最受欢迎的剧本（按下载次数）</p>
            </div>
            <div className="px-4 py-2 bg-sky-50 border border-sky-200 rounded-full">
              <span className="text-sm font-semibold text-sky-700">Top 10</span>
            </div>
          </div>
          {downloads.length === 0 ? (
            <div className="text-center py-12 text-surface-on-variant">暂无下载数据</div>
          ) : (
            <div className="h-96">
              <canvas ref={dlRef} className="w-full h-full" />
            </div>
          )}
        </div>
      </div>

      {/* 点赞和收藏 - 并排 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-title-large font-semibold text-surface-on mb-1">点赞排行榜</h3>
                <p className="text-body-small text-surface-on-variant">最受喜爱的剧本</p>
              </div>
              <div className="px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full">
                <span className="text-sm font-semibold text-cyan-700">Top 10</span>
              </div>
            </div>
            {likes.length === 0 ? (
              <div className="text-center py-12 text-surface-on-variant">暂无点赞数据</div>
            ) : (
              <div className="h-80">
                <canvas ref={likeRef} className="w-full h-full" />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-title-large font-semibold text-surface-on mb-1">收藏排行榜</h3>
                <p className="text-body-small text-surface-on-variant">最多收藏的剧本</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                <span className="text-sm font-semibold text-emerald-700">Top 10</span>
              </div>
            </div>
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-surface-on-variant">暂无收藏数据</div>
            ) : (
              <div className="h-80">
                <canvas ref={favRef} className="w-full h-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


