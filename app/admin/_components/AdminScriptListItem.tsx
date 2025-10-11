'use client'
import { useState } from 'react'
import AdminScriptViewModal from './AdminScriptViewModal'
import StateBadge from './StateBadge'

type Item = { 
  id: string
  title: string
  state?: string
  authorName?: string | null 
}

export default function AdminScriptListItem({ 
  item, 
  index,
  pageNum,
  pageSize
}: { 
  item: Item
  index: number
  pageNum: number
  pageSize: number
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  
  const isAbandoned = item.state === 'abandoned'
  const displayNumber = (pageNum - 1) * pageSize + index + 1

  async function onDelete() {
    if (!confirm('确定要删除该剧本吗？此操作不可恢复')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/scripts/${item.id}/delete`, { method: 'POST' })
      if (!res.ok) { 
        alert('删除失败')
        return 
      }
      location.reload()
    } finally { 
      setDeleting(false) 
    }
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
  
  return (
    <>
      {/* 桌面端表格行 */}
      <div className="hidden md:grid grid-cols-[50px_1fr_150px_120px_280px] gap-4 px-4 py-4 border-b border-outline hover:bg-gray-50 transition-colors items-center">
        {/* 序号 */}
        <div className="text-center text-surface-on-variant text-sm font-medium">
          {displayNumber}
        </div>
        
        {/* 标题 */}
        <div className="font-medium text-surface-on truncate" title={item.title}>
          {item.title}
        </div>
        
        {/* 作者 */}
        <div className="text-surface-on-variant text-sm truncate" title={item.authorName || '-'}>
          {item.authorName || '-'}
        </div>
        
        {/* 状态标签 */}
        <div>
          <StateBadge state={item.state} />
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-2">
          <button 
            className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors border border-outline hover:bg-gray-50" 
            onClick={() => setOpen(true)}
          >
            查看
          </button>
          {isAbandoned ? (
            <button 
              className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={onRestore}
              disabled={restoring}
            >
              {restoring ? '恢复中...' : '🔄 恢复'}
            </button>
          ) : (
            <a 
              className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors bg-primary text-on-primary hover:bg-primary/90"
              href={`/admin/scripts/${item.id}`}
            >
              编辑
            </a>
          )}
          <button 
            className="px-3 py-1.5 text-sm rounded-md font-medium transition-colors bg-error text-on-error hover:bg-error/90 disabled:opacity-50"
            onClick={onDelete}
            disabled={deleting || restoring}
          >
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
      
      {/* 移动端列表项 */}
      <div className="md:hidden p-4 border-b border-outline">
        {/* 序号和标题 */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-surface-on-variant text-sm font-medium shrink-0">
            #{displayNumber}
          </span>
          <span className="font-medium text-surface-on flex-1">
            {item.title}
          </span>
        </div>
        
        {/* 元信息 */}
        <div className="flex items-center gap-3 text-sm text-surface-on-variant mb-3 flex-wrap">
          <span>作者：{item.authorName || '-'}</span>
          <span>·</span>
          <StateBadge state={item.state} />
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button 
            className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors border border-outline hover:bg-gray-50 min-h-touch"
            onClick={() => setOpen(true)}
          >
            查看
          </button>
          {isAbandoned ? (
            <button 
              className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 min-h-touch"
              onClick={onRestore}
              disabled={restoring}
            >
              {restoring ? '恢复中...' : '🔄 恢复'}
            </button>
          ) : (
            <a 
              className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors bg-primary text-on-primary hover:bg-primary/90 text-center min-h-touch flex items-center justify-center"
              href={`/admin/scripts/${item.id}`}
            >
              编辑
            </a>
          )}
          <button 
            className="flex-1 px-3 py-2 text-sm rounded-md font-medium transition-colors bg-error text-on-error hover:bg-error/90 disabled:opacity-50 min-h-touch"
            onClick={onDelete}
            disabled={deleting || restoring}
          >
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
      
      {open && <AdminScriptViewModal id={item.id} open={open} onClose={() => setOpen(false)} />}
    </>
  )
}

