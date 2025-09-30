'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReviewDetailModal from './ReviewDetailModal'

export default function ReviewItem({ id, title, author }: { id: string; title: string; author?: string | null }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function approve() {
    const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'approved' }) })
    if (res.ok) router.refresh()
  }
  async function reject(reason: string) {
    if (!reason.trim()) return
    const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'rejected', reason }) })
    if (res.ok) router.refresh()
  }

  async function onDelete() {
    if (!confirm('确定删除该提交记录吗？此操作不可恢复')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' })
      if (!res.ok) { alert('删除失败'); return }
      router.refresh()
    } finally { setDeleting(false) }
  }

  return (
    <div className="m3-card-elevated cursor-pointer hover:shadow-elevation-3 transition-all duration-300 overflow-hidden">
      <button className="p-6 text-left w-full" onClick={()=>setOpen(true)}>
        <div className="text-title-large mb-1 text-surface-on">{title}</div>
        <div className="text-body-small text-surface-on-variant">作者：{author || '-'}</div>
      </button>
      <div className="px-6 pb-6">
        <button className="m3-btn-filled-tonal-error w-full" onClick={onDelete} disabled={deleting}>
          {deleting ? '删除中...' : '删除'}
        </button>
      </div>
      <ReviewDetailModal id={id} open={open} onClose={()=>setOpen(false)} onApproved={approve} onRejected={reject} />
    </div>
  )
}


