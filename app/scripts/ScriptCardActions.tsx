'use client'
import { useEffect, useState } from 'react'
import { emitToast } from '../_components/Toaster'

type Stats = { likes: number; favorites: number; liked: boolean; favorited: boolean }

export default function ScriptCardActions({ id, initial }: { id: string; initial?: Stats }) {
  const [stats, setStats] = useState<Stats | null>(initial ?? null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(null)

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ type, text })
    setTimeout(() => setToast(null), 2000)
  }

  async function load() {
    try {
      const res = await fetch(`/api/scripts/${id}/stats`, { cache: 'no-store' })
      const j = await res.json().catch(()=>({}))
      const d = (j?.data ?? j) as Stats
      if (d && typeof d.likes === 'number') setStats(d)
    } catch {}
  }
  // 如果没有 initial，再监听批量预取
  useEffect(() => {
    if (initial) return
    const handler = async (e: any) => {
      if (!e?.detail || !Array.isArray(e.detail.ids)) return
      const ids: string[] = e.detail.ids
      if (!ids.includes(id)) return
      // 只有首次缺失时请求批量接口
      const cache = (window as any).__statsBatchCache as Record<string, Stats> | undefined
      if (cache && cache[id]) { setStats(cache[id]); return }
      try {
        const res = await fetch('/api/scripts/stats-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
        const j = await res.json().catch(()=>({}))
        const items = (j?.data?.items ?? j?.items ?? {}) as Record<string, Stats>
        ;(window as any).__statsBatchCache = items
        if (items[id]) setStats(items[id])
      } catch { /* 忽略错误 */ }
    }
    window.addEventListener('scripts:prefetch-stats', handler as any)
    return () => window.removeEventListener('scripts:prefetch-stats', handler as any)
  }, [])

  async function toggleLike() {
    const cur = stats ?? { likes: 0, favorites: 0, liked: false, favorited: false }
    setMsg('')
    setLoading(true)
    try {
      const method = cur.liked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/scripts/${id}/like`, { method })
      if (res.status === 401) {
        const next = encodeURIComponent(location.href)
        location.href = `/login?next=${next}`
        return
      }
      const d = await res.json().catch(()=>({}))
      if (!res.ok) {
        setMsg(d?.error?.message || '操作失败')
        return
      }
      const p = (d?.data ?? d) as { liked?: boolean; count?: number }
      emitToast(p?.liked ? '已点赞' : '已取消点赞', 'success')
      const nextStats = (s: Stats) => ({ ...s, liked: !!p?.liked, likes: typeof p?.count === 'number' ? p.count : s.likes })
      // 直接以服务端结果为准，避免未登录时的+1闪烁
      setStats(s => s ? nextStats(s) : nextStats(cur))
      // 同步更新批量缓存，避免其它视图读到旧值
      try {
        const cache = (window as any).__statsBatchCache as Record<string, Stats> | undefined
        if (cache) {
          const exist = cache[id] || cur
          cache[id] = nextStats(exist)
        }
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  async function toggleFav() {
    const cur = stats ?? { likes: 0, favorites: 0, liked: false, favorited: false }
    setMsg('')
    setLoading(true)
    try {
      const method = cur.favorited ? 'DELETE' : 'POST'
      const res = await fetch(`/api/scripts/${id}/favorite`, { method })
      if (res.status === 401) {
        const next = encodeURIComponent(location.href)
        location.href = `/login?next=${next}`
        return
      }
      const d = await res.json().catch(()=>({}))
      if (!res.ok) { emitToast(d?.error?.message || '操作失败', 'error'); return }
      const p = (d?.data ?? d) as { favorited?: boolean; count?: number }
      emitToast(p?.favorited ? '已收藏' : '已取消收藏', 'success')
      const nextFav = (s: Stats) => ({ ...s, favorited: !!p?.favorited, favorites: typeof p?.count === 'number' ? p.count : s.favorites })
      setStats(s => s ? nextFav(s) : nextFav(cur))
      try {
        const cache = (window as any).__statsBatchCache as Record<string, Stats> | undefined
        if (cache) {
          const exist = cache[id] || cur
          cache[id] = nextFav(exist)
        }
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id={`script-actions-${id}`} className="flex flex-col gap-3">
      {toast && (
        <div className={`rounded-sm border px-3 py-2 text-body-small ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {toast.text}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <a className="m3-btn-outlined flex-1 text-center min-h-touch" href={`/scripts/${id}`}>查看详情</a>
        <div className="flex items-center gap-2">
          <button 
            className={`inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm transition-all duration-standard min-w-touch min-h-touch active:scale-95 ${
              stats?.liked 
                ? 'bg-red-50 text-red-600 border border-red-200' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={toggleLike} 
            disabled={loading}
            aria-label={stats?.liked ? '取消点赞' : '点赞'}
          >
            <svg className="w-5 h-5" fill={stats?.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-medium">{stats?.likes ?? 0}</span>
          </button>
          <button 
            className={`inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm transition-all duration-standard min-w-touch min-h-touch active:scale-95 ${
              stats?.favorited 
                ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={toggleFav} 
            disabled={loading}
            aria-label={stats?.favorited ? '取消收藏' : '收藏'}
          >
            <svg className="w-5 h-5" fill={stats?.favorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="font-medium">{stats?.favorites ?? 0}</span>
          </button>
        </div>
      </div>
      {msg && <div className="text-body-small text-error">{msg}</div>}
    </div>
  )
}


