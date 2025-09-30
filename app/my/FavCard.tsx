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
    <div className="p-6">
      <h3 className="text-xl font-bold mb-2 text-surface-on group-hover:text-sky-600 transition-colors">
        {title}
      </h3>
      
      <div className="flex items-center gap-2 text-body-small text-surface-on-variant mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>作者：{authorName || '未知'}</span>
      </div>
      
      <div className="flex gap-2">
        <a className="m3-btn-outlined text-sm px-4 py-2 flex-1 justify-center" href={`/scripts/${id}`}>
          查看详情
        </a>
        <button 
          className="btn-danger text-sm px-4 py-2 rounded-xl" 
          type="button" 
          onClick={onUnfavorite} 
          disabled={loading}
          title="取消收藏"
        >
          {loading ? '...' : '取消收藏'}
        </button>
      </div>
    </div>
  )
}


