# Spec 029: 修复管理员剧本列表切换状态时的 Hydration 错误

## 问题描述

在管理员剧本列表页面切换状态时，出现 React Hydration 错误：

```
Hydration failed because the server rendered text didn't match the client.
```

## 根本原因

问题出在 `AdminScriptItem.tsx` 组件中使用了 `mounted` 状态模式（lines 11-68），这导致：

1. **服务端渲染**：父组件（Server Component）获取数据并渲染 `AdminScriptItem`
2. **初始客户端状态**：`mounted = false`，组件渲染骨架屏 UI（skeleton）
3. **Hydration 冲突**：服务端渲染的实际内容与客户端初始渲染的骨架屏不匹配
4. **useEffect 触发**：设置 `mounted = true`，重新渲染真实内容

```tsx
// 当前问题代码 (lines 11-68)
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <div>骨架屏...</div>  // ❌ 与服务端渲染不匹配
}

return <div>实际内容...</div>
```

## 解决方案

移除 `mounted` 状态模式，因为：

1. 父组件已经是 Server Component，数据在服务端获取
2. 所有数据在首次渲染时就已经可用
3. 按钮交互需要客户端处理，但内容显示可以直接 hydrate

### 修改内容

**文件：** `xueran-juben-project/app/admin/_components/AdminScriptItem.tsx`

**变更：**

1. 移除 `mounted` state 和相关 `useEffect`
2. 移除条件渲染的骨架屏
3. 直接渲染内容，保持客户端交互功能

```tsx
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
```

## 为什么这样修改是正确的

### ✅ 优势

1. **消除 Hydration 错误**：服务端和客户端渲染相同内容
2. **更快的首次渲染**：不需要等待 `useEffect` 执行
3. **更简单的代码**：移除不必要的状态管理
4. **更好的 SEO**：服务端渲染的内容立即可见

### 🎯 保留的功能

- ✅ 查看按钮的弹窗交互
- ✅ 删除功能和加载状态
- ✅ 恢复功能和加载状态
- ✅ 所有按钮的客户端交互

### 📊 技术原理

#### 之前的流程（有问题）：
```
Server → 渲染真实内容
         ↓
Client → mounted=false → 骨架屏 → ❌ Hydration Mismatch
         ↓
       useEffect → mounted=true → 真实内容
```

#### 修复后的流程：
```
Server → 渲染真实内容
         ↓
Client → 直接 hydrate 真实内容 → ✅ 完美匹配
         ↓
       交互功能正常工作
```

## 实施步骤

1. ✅ 分析问题，定位根本原因
2. ⏳ 修改 `AdminScriptItem.tsx`，移除 `mounted` 模式
3. ⏳ 测试页面切换状态，确认无 hydration 错误
4. ⏳ 验证所有按钮功能正常工作

## 验证清单

- [ ] 访问 `/admin/scripts` 页面
- [ ] 在不同状态标签间切换（待审核、已通过、已拒绝、已废弃）
- [ ] 确认浏览器控制台无 hydration 错误
- [ ] 测试"查看"按钮打开弹窗
- [ ] 测试"编辑"链接跳转
- [ ] 测试"删除"按钮功能
- [ ] 测试"恢复并接管"按钮功能（已废弃状态）

## 相关文件

- `xueran-juben-project/app/admin/_components/AdminScriptItem.tsx` - 需要修改
- `xueran-juben-project/app/admin/scripts/page.tsx` - 父组件（不需要修改）

## 备注

这是一个常见的 Next.js 13+ App Router 反模式。在 Server Components 时代，不应该在 Client Components 中使用 `mounted` 状态来延迟渲染，因为数据已经在服务端准备好了。

