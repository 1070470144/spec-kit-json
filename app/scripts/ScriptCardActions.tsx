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
    <div id={`script-actions-${id}`} className="flex flex-col gap-2">
      {toast && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {toast.text}
        </div>
      )}
      <div className="flex items-center justify-between">
        <a className="btn btn-outline" href={`/scripts/${id}`}>查看详情</a>
        <div className="flex items-center gap-2">
          <button className={`btn ${stats?.liked ? 'btn-primary' : 'btn-outline'}`} onClick={toggleLike} disabled={loading}>
            👍 {stats?.likes ?? ''}
          </button>
          <button className={`btn ${stats?.favorited ? 'btn-primary' : 'btn-outline'}`} onClick={toggleFav} disabled={loading}>
            ⭐ {stats?.favorites ?? ''}
          </button>
        </div>
      </div>
      {msg && <div className="muted">{msg}</div>}
    </div>
  )
}


