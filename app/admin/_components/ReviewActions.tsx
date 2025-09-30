'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewActions({ id }: { id: string }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function approve() {
    setLoading('approve'); setMsg('')
    try {
      const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'approved' }) })
      const j = await res.json().catch(()=>({}))
      if (!res.ok) { setMsg(j?.error?.message || '操作失败'); return }
      router.refresh()
    } finally { setLoading(null) }
  }

  async function reject() {
    if (!reason.trim()) { setMsg('请填写拒绝理由'); return }
    setLoading('reject'); setMsg('')
    try {
      const res = await fetch(`/api/scripts/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'rejected', reason }) })
      const j = await res.json().catch(()=>({}))
      if (!res.ok) { setMsg(j?.error?.message || '操作失败'); return }
      router.refresh()
    } finally { setLoading(null) }
  }

  return (
    <div className="space-y-3">
      <textarea 
        className="textarea" 
        placeholder="拒绝理由（仅拒绝时必填）" 
        value={reason} 
        onChange={e=>setReason(e.target.value)}
        rows={3}
      />
      <div className="flex gap-3">
        <button className="m3-btn-filled flex-1" onClick={approve} disabled={loading!==null}>
          {loading === 'approve' ? '处理中...' : '通过'}
        </button>
        <button className="m3-btn-outlined flex-1" onClick={reject} disabled={loading!==null}>
          {loading === 'reject' ? '处理中...' : '拒绝'}
        </button>
      </div>
      {msg && <div className="text-body-small text-error">{msg}</div>}
    </div>
  )
}


