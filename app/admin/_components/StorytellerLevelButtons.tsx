'use client'

import { useState } from 'react'

export default function StorytellerLevelButtons({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'level1' | 'level2' | 'reject' | ''>('')
  const [reason, setReason] = useState('')

  async function submit() {
    if (!action) return
    setLoading(true)
    try {
      if (action === 'reject') {
        if (!reason.trim()) { alert('请填写拒绝原因'); setLoading(false); return }
        const res = await fetch(`/api/admin/storytellers/reject?id=${encodeURIComponent(id)}&reason=${encodeURIComponent(reason)}`, { method: 'POST' })
        if (!res.ok) { const j = await res.json().catch(()=>({})); alert(j?.error?.message || '操作失败'); setLoading(false); return }
      } else {
        const level = action === 'level1' ? 1 : 2
        const res = await fetch(`/api/admin/storytellers/approve?level=${level}&id=${encodeURIComponent(id)}`, { method: 'POST' })
        if (!res.ok) { const j = await res.json().catch(()=>({})); alert(j?.error?.message || '操作失败'); setLoading(false); return }
      }
      location.reload()
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <select className="input w-36" value={action} onChange={e=>setAction(e.target.value as any)}>
        <option value="">选择操作</option>
        <option value="level1">一星</option>
        <option value="level2">二星</option>
        <option value="reject">拒绝</option>
      </select>
      {action==='reject' && (
        <input className="input w-40" placeholder="拒绝原因" value={reason} onChange={e=>setReason(e.target.value)} />
      )}
      <button className="btn btn-primary" type="button" onClick={submit} disabled={loading || !action}>确定</button>
    </div>
  )
}


