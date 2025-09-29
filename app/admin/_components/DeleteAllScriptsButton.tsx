'use client'

export default function DeleteAllScriptsButton() {
  async function handleClick() {
    if (!confirm('确定删除所有剧本及其关联数据？此操作不可恢复')) return
    try {
      const res = await fetch('/api/admin/scripts', { method: 'DELETE' })
      if (!res.ok) {
        alert('删除失败')
        return
      }
      location.reload()
    } catch {
      alert('网络错误，删除失败')
    }
  }

  return (
    <button className="btn btn-danger" type="button" onClick={handleClick}>一键删除全部</button>
  )
}


