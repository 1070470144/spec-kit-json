'use client'
import { useState } from 'react'
import AdminScriptViewModal from './AdminScriptViewModal'

type Item = { id: string; title: string; state?: string; authorName?: string | null }

export default function AdminScriptItem({ item }: { item: Item }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function onDelete() {
    if (!confirm('确定要删除该剧本吗？此操作不可恢复')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/scripts/${item.id}/delete`, { method: 'POST' })
      if (!res.ok) { alert('删除失败'); return }
      location.reload()
    } finally { setDeleting(false) }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="font-medium">{item.title}</div>
        <div className="muted">作者：{item.authorName || '-'}</div>
        <div className="muted">状态：{item.state || '-'}</div>
        <div className="card-actions">
          <button className="btn btn-outline" onClick={()=>setOpen(true)}>查看</button>
          <a className="btn btn-primary" href={`/admin/scripts/${item.id}`}>编辑</a>
          <button className="btn btn-danger" onClick={onDelete} disabled={deleting}>删除</button>
        </div>
      </div>
      <AdminScriptViewModal id={item.id} open={open} onClose={()=>setOpen(false)} />
    </div>
  )
}


