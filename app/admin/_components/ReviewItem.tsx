'use client'
import { useState } from 'react'
import ReviewDetailModal from './ReviewDetailModal'

export default function ReviewItem({ id, title, author }: { id: string; title: string; author?: string | null }) {
  const [open, setOpen] = useState(false)

  async function approve() {
    const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'approved' }) })
    if (res.ok) location.reload()
  }
  async function reject(reason: string) {
    if (!reason.trim()) return
    const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'rejected', reason }) })
    if (res.ok) location.reload()
  }

  return (
    <div className="card">
      <button className="card-body text-left w-full" onClick={()=>setOpen(true)}>
        <div className="card-title">{title}</div>
        <div className="muted">作者：{author || '-'}</div>
      </button>
      <ReviewDetailModal id={id} open={open} onClose={()=>setOpen(false)} onApproved={approve} onRejected={reject} />
    </div>
  )
}


