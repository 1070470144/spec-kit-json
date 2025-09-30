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
    <div className="grid gap-6 md:grid-cols-3">
      <div className="card">
        <div className="card-body">
          <div className="card-title">下载 Top10</div>
          {downloads.length === 0 ? <div className="muted">暂无数据</div> : (
            <div className="h-72"><canvas ref={dlRef} className="w-full h-full" /></div>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="card-title">点赞 Top10</div>
          {likes.length === 0 ? <div className="muted">暂无数据</div> : (
            <div className="h-72"><canvas ref={likeRef} className="w-full h-full" /></div>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="card-title">收藏 Top10</div>
          {favorites.length === 0 ? <div className="muted">暂无数据</div> : (
            <div className="h-72"><canvas ref={favRef} className="w-full h-full" /></div>
          )}
        </div>
      </div>
    </div>
  )
}


