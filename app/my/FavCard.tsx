'use client'
import { useState } from 'react'
import { emitToast } from '../_components/Toaster'

type Props = { id: string; title: string; authorName?: string | null }

export default function FavCard({ id, title, authorName }: Props) {
  const [removed, setRemoved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onUnfavorite() {
    setLoading(true)
    try {
      const res = await fetch(`/api/scripts/${id}/favorite`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(()=>({}))
        emitToast(d?.error?.message || '取消收藏失败', 'error')
        return
      }
      emitToast('已取消收藏', 'success')
      setRemoved(true)
    } finally {
      setLoading(false)
    }
  }

  if (removed) return null

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-title">{title}</div>
        <div className="muted">作者：{authorName || '-'}</div>
        <div className="card-actions">
          <a className="btn btn-outline" href={`/scripts/${id}`}>查看详情</a>
          <button className="btn btn-outline" type="button" onClick={onUnfavorite} disabled={loading}>取消收藏</button>
        </div>
      </div>
    </div>
  )
}


