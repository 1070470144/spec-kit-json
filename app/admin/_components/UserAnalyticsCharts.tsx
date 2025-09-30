'use client'
import { useEffect, useMemo, useRef } from 'react'

export default function UserAnalyticsCharts({ topRegions, trend }: { topRegions: Array<{ region: string; count: number; ratio: number }>; trend: Array<{ date: string; login: number; register: number }> }) {
  const pieRef = useRef<HTMLCanvasElement | null>(null)
  const lineRef = useRef<HTMLCanvasElement | null>(null)
  const pieChartRef = useRef<any>(null)
  const lineChartRef = useRef<any>(null)

  const total = useMemo(() => topRegions.reduce((s, r) => s + r.count, 0), [topRegions])
  const pieLabels = useMemo(() => topRegions.map(r => r.region || '未知'), [topRegions])
  const pieData = useMemo(() => topRegions.map(r => r.count), [topRegions])
  const lineLabels = useMemo(() => trend.map(p => p.date.slice(5)), [trend])
  const lineLogin = useMemo(() => trend.map(p => p.login), [trend])
  const lineRegister = useMemo(() => trend.map(p => p.register), [trend])

  useEffect(() => {
    let cancelled = false
    function loadScript(src: string) {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve()
        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Chart.js load error'))
        document.head.appendChild(s)
      })
    }
    async function draw() {
      // use UMD build via CDN to avoid bundler interop issues
      await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js')
      const Chart = (window as any).Chart
      
      if (!Chart || typeof Chart !== 'function') {
        console.error('Chart.js not loaded')
        return
      }

      if (pieChartRef.current) { pieChartRef.current.destroy(); pieChartRef.current = null }
      if (lineChartRef.current) { lineChartRef.current.destroy(); lineChartRef.current = null }

      if (pieRef.current && total > 0) {
        pieChartRef.current = new Chart(pieRef.current.getContext('2d'), {
          type: 'doughnut',
          data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: colors, borderWidth: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        })
      }

      if (lineRef.current && trend.length > 0) {
        lineChartRef.current = new Chart(lineRef.current.getContext('2d'), {
          type: 'line',
          data: {
            labels: lineLabels,
            datasets: [
              { label: '登录', data: lineLogin, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.2)', tension: 0.3 },
              { label: '注册', data: lineRegister, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.2)', tension: 0.3 }
            ]
          },
          options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        })
      }
    }
    draw()
    return () => {
      cancelled = true
      if (pieChartRef.current) pieChartRef.current.destroy()
      if (lineChartRef.current) lineChartRef.current.destroy()
    }
  }, [pieLabels, pieData, lineLabels, lineLogin, lineRegister, total, trend])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <div className="card-body">
          <div className="card-title">IP 地域占比</div>
          {!topRegions.length && <div className="muted">暂无数据</div>}
          {!!topRegions.length && (
            <div className="w-full flex items-center justify-center">
              <div className="w-64 h-64">
                <canvas ref={pieRef} className="w-full h-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="card-title">14 天趋势（登录/注册）</div>
          {!trend.length && <div className="muted">暂无数据</div>}
          {!!trend.length && (
            <div className="w-full">
              <canvas ref={lineRef} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const colors = ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']


