'use client'
import { useState } from 'react'
import AdminScriptViewModal from './AdminScriptViewModal'

type Item = { id: string; title: string; state?: string; authorName?: string | null }

export default function AdminScriptItem({ item }: { item: Item }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  async function onDelete() {
    if (!confirm('确定要删除该剧本吗？此操作不可恢复')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/scripts/${item.id}/delete`, { method: 'POST' })
      if (!res.ok) { alert('删除失败'); return }
      location.reload()
    } finally { setDeleting(false) }
  }

  async function onRestore() {
    if (!confirm('确定要恢复此剧本并转移为系统所有吗？\n\n恢复后：\n- 剧本将重新上架\n- 原用户将无法再编辑此剧本\n- 剧本归系统管理')) return
    setRestoring(true)
    try {
      const res = await fetch(`/api/admin/scripts/${item.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newState: 'published', transferOwnership: true })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(`恢复失败：${data?.error?.message || '未知错误'}`)
        return
      }
      alert('恢复成功！')
      location.reload()
    } catch (error) {
      console.error('Restore failed:', error)
      alert('恢复失败，请重试')
    } finally {
      setRestoring(false)
    }
  }

  const isAbandoned = item.state === 'abandoned'

  return (
    <div className="card">
      <div className="card-body">
        <div className="font-medium">{item.title}</div>
        <div className="muted">作者：{item.authorName || '-'}</div>
        <div className="muted">状态：{item.state || '-'}</div>
        <div className="card-actions flex flex-wrap gap-2">
          <button className="btn btn-outline min-h-touch" onClick={()=>setOpen(true)}>查看</button>
          
          {isAbandoned ? (
            <button 
              className="btn bg-green-600 hover:bg-green-700 text-white min-h-touch" 
              onClick={onRestore} 
              disabled={restoring}
            >
              {restoring ? '恢复中...' : '🔄 恢复并接管'}
            </button>
          ) : (
            <a className="btn btn-primary min-h-touch" href={`/admin/scripts/${item.id}`}>
              编辑
            </a>
          )}
          
          <button 
            className="btn btn-danger min-h-touch" 
            onClick={onDelete} 
            disabled={deleting || restoring}
          >
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
      {open && <AdminScriptViewModal id={item.id} open={open} onClose={()=>setOpen(false)} />}
    </div>
  )
}


