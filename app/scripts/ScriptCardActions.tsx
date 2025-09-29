'use client'
import { useEffect, useState } from 'react'
import { emitToast } from '../_components/Toaster'

type Stats = { likes: number; favorites: number; liked: boolean; favorited: boolean }

export default function ScriptCardActions({ id }: { id: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
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
  useEffect(() => { load() }, [])

  async function toggleLike() {
    if (!stats) return
    setMsg('')
    setLoading(true)
    try {
      const method = stats.liked ? 'DELETE' : 'POST'
      // 乐观更新：立即刷新计数与状态
      setStats(s => s ? { ...s, liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) } : s)
      const res = await fetch(`/api/scripts/${id}/like`, { method })
      if (res.status === 401) { setMsg('请先登录后再点赞'); return }
      const d = await res.json().catch(()=>({}))
      if (!res.ok) {
        setMsg(d?.error?.message || '操作失败')
        // 回滚并拉取最新
        await load()
        return
      }
      emitToast(d?.liked ? '已点赞' : '已取消点赞', 'success')
      // 以服务端计数为准再刷新一次
      setStats(s => s ? { ...s, liked: d?.liked, likes: typeof d?.count === 'number' ? d.count : s.likes } : s)
      await load()
    } finally {
      setLoading(false)
    }
  }

  async function toggleFav() {
    if (!stats) return
    setMsg('')
    setLoading(true)
    try {
      const method = stats.favorited ? 'DELETE' : 'POST'
      // 乐观更新
      setStats(s => s ? { ...s, favorited: !s.favorited, favorites: s.favorites + (s.favorited ? -1 : 1) } : s)
      const res = await fetch(`/api/scripts/${id}/favorite`, { method })
      if (res.status === 401) { emitToast('请先登录后再收藏', 'error'); await load(); return }
      const d = await res.json().catch(()=>({}))
      if (!res.ok) { emitToast(d?.error?.message || '操作失败', 'error'); await load(); return }
      emitToast(d?.favorited ? '已收藏' : '已取消收藏', 'success')
      setStats(s => s ? { ...s, favorited: d?.favorited, favorites: typeof d?.count === 'number' ? d.count : s.favorites } : s)
      await load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
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


