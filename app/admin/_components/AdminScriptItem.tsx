'use client'
import { useState } from 'react'
import AdminScriptViewModal from './AdminScriptViewModal'

type Item = { id: string; title: string; state?: string; authorName?: string | null }

export default function AdminScriptItem({ item }: { item: Item }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card">
      <div className="card-body">
        <div className="font-medium">{item.title}</div>
        <div className="muted">作者：{item.authorName || '-'}</div>
        <div className="muted">状态：{item.state || '-'}</div>
        <div className="card-actions">
          <button className="btn btn-outline" onClick={()=>setOpen(true)}>查看</button>
          <a className="btn btn-primary" href={`/admin/scripts/${item.id}`}>编辑</a>
        </div>
      </div>
      <AdminScriptViewModal id={item.id} open={open} onClose={()=>setOpen(false)} />
    </div>
  )
}


