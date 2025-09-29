'use client'
import { useState } from 'react'
import ReviewDetailModal from './ReviewDetailModal'

export default function ReviewItem({ id, title, author }: { id: string; title: string; author?: string | null }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function approve() {
    const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'approved' }) })
    if (res.ok) location.reload()
  }
  async function reject(reason: string) {
    if (!reason.trim()) return
    const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'rejected', reason }) })
    if (res.ok) location.reload()
  }

  async function onDelete() {
    if (!confirm('确定删除该提交记录吗？此操作不可恢复')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' })
      if (!res.ok) { alert('删除失败'); return }
      location.reload()
    } finally { setDeleting(false) }
  }

  return (
    <div className="card">
      <button className="card-body text-left w-full" onClick={()=>setOpen(true)}>
        <div className="card-title">{title}</div>
        <div className="muted">作者：{author || '-'}</div>
      </button>
      <div className="card-body pt-0">
        <div className="card-actions">
          <button className="btn btn-danger" onClick={onDelete} disabled={deleting}>删除</button>
        </div>
      </div>
      <ReviewDetailModal id={id} open={open} onClose={()=>setOpen(false)} onApproved={approve} onRejected={reject} />
    </div>
  )
}


