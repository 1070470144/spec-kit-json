'use client'
import { useState } from 'react'

export default function ReviewActions({ id }: { id: string }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [msg, setMsg] = useState('')

  async function approve() {
    setLoading('approve'); setMsg('')
    try {
      const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'approved' }) })
      const j = await res.json().catch(()=>({}))
      if (!res.ok) { setMsg(j?.error?.message || '操作失败'); return }
      location.reload()
    } finally { setLoading(null) }
  }

  async function reject() {
    if (!reason.trim()) { setMsg('请填写拒绝理由'); return }
    setLoading('reject'); setMsg('')
    try {
      const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'rejected', reason }) })
      const j = await res.json().catch(()=>({}))
      if (!res.ok) { setMsg(j?.error?.message || '操作失败'); return }
      location.reload()
    } finally { setLoading(null) }
  }

  return (
    <div className="space-y-2">
      <textarea className="textarea" placeholder="拒绝理由（仅拒绝时必填）" value={reason} onChange={e=>setReason(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={approve} disabled={loading!==null}>通过</button>
        <button className="btn btn-outline" onClick={reject} disabled={loading!==null}>拒绝</button>
      </div>
      {msg && <div className="help-error">{msg}</div>}
    </div>
  )
}


