# Spec: 审核界面 UI 闪烁修复

**ID**: 006-review-ui-flicker-fix  
**Created**: 2025-09-30  
**Status**: Draft  
**Priority**: High  
**Type**: Bug Fix + UX Improvement

## 问题描述

剧本审核界面在操作（通过/拒绝）后会出现 UI 闪烁现象，影响用户体验。

### 闪烁场景

1. **点击通过/拒绝按钮后**: 整页刷新导致白屏闪烁
2. **打开详情 Modal**: 数据加载延迟导致内容闪现
3. **一键通过全部**: 页面重载导致列表闪烁

## 根本原因分析

### 原因 1: location.reload() 导致整页刷新
```typescript
// ReviewItem.tsx:11, 16
async function approve() {
  const res = await fetch(`/api/scripts/${id}/review`, ...)
  if (res.ok) location.reload()  // ❌ 整页刷新
}
```

**问题**: 
- 完全重新加载页面
- 失去所有客户端状态
- 网络请求重新发起
- 白屏闪烁

### 原因 2: Modal 数据加载无 Loading 状态
```typescript
// ReviewDetailModal.tsx:10-21
useEffect(() => {
  if (!open) return
  async function load() {
    const res = await fetch(`/api/scripts/${id}`, ...)
    const d = (j?.data ?? j) as Detail
    if (!aborted) setDetail(d)  // ❌ 加载期间 detail 为 null
  }
  load()
}, [id, open])

// 渲染时没有 loading 状态
<div className="text-base font-medium">{detail?.title || '...'}</div>
```

**问题**:
- 打开 Modal 时，detail 初始为 null
- 数据加载完成前显示 "..."
- 数据到达后突然变化，造成闪烁

### 原因 3: 服务端/客户端状态不同步
- Server Component (page.tsx) 渲染初始数据
- Client Component (ReviewItem) 操作后强制刷新
- 状态管理分散，无法优雅更新

## 解决方案

### 方案 1: 使用 Router Refresh（推荐）
```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()

async function approve() {
  const res = await fetch(`/api/scripts/${id}/review`, ...)
  if (res.ok) {
    router.refresh()  // ✅ 仅刷新 Server Component 数据
  }
}
```

**优点**:
- 仅重新获取 Server Component 数据
- 保持客户端状态
- 无白屏闪烁
- Next.js 13+ 推荐方式

### 方案 2: 乐观 UI 更新
```typescript
const [items, setItems] = useState(initialItems)

async function approve() {
  // 乐观更新：立即从列表移除
  setItems(prev => prev.filter(i => i.id !== id))
  
  const res = await fetch(`/api/scripts/${id}/review`, ...)
  if (!res.ok) {
    // 失败时恢复
    router.refresh()
  }
}
```

**优点**:
- 即时反馈
- 无闪烁
- 最佳用户体验

### 方案 3: Modal Loading 状态
```typescript
const [detail, setDetail] = useState<Detail | null>(null)
const [loading, setLoading] = useState(false)

useEffect(() => {
  if (!open) return
  setLoading(true)
  setDetail(null)
  
  async function load() {
    try {
      const res = await fetch(`/api/scripts/${id}`, ...)
      const d = await res.json()
      if (!aborted) setDetail(d?.data ?? d)
    } finally {
      if (!aborted) setLoading(false)
    }
  }
  load()
}, [id, open])

// 渲染 Loading 状态
{loading && <div className="text-center py-8">加载中...</div>}
{!loading && detail && <div>...</div>}
```

## 技术实现

### 修复优先级

#### P0 - 必须修复
1. **ReviewItem**: 使用 `router.refresh()` 替代 `location.reload()`
2. **ReviewDetailModal**: 添加 Loading 状态

#### P1 - 建议修复
3. **一键通过**: 添加 Loading 状态和进度提示
4. **删除操作**: 乐观 UI 更新

### 改动文件

1. **ReviewItem.tsx**
   - 导入 `useRouter`
   - 替换 `location.reload()` 为 `router.refresh()`
   - 添加 toast 反馈（可选）

2. **ReviewDetailModal.tsx**
   - 添加 `loading` 状态
   - 渲染 Loading UI
   - 添加骨架屏（可选）

3. **ReviewActions.tsx**
   - 使用 `router.refresh()` 替代 `location.reload()`
   - 优化错误处理

## 性能改进

### 当前性能问题
- 每次操作都整页刷新（~1-2s）
- 重新请求所有数据
- 重新渲染所有组件

### 优化后性能
- 仅刷新 Server Component（~200-500ms）
- 复用客户端组件状态
- 平滑的 UI 过渡

## 用户体验改进

### Before (当前)
```
点击通过 → 白屏闪烁 → 页面重新加载 → 列表更新
       ❌ 闪烁     ❌ 慢       ❌ 失去滚动位置
```

### After (优化后)
```
点击通过 → Loading 状态 → 平滑移除/更新 → 完成
       ✅ 无闪烁    ✅ 快      ✅ 保持位置
```

## 成功指标

- ✅ 审核操作无白屏闪烁
- ✅ Modal 数据加载有 Loading 状态
- ✅ 操作响应时间 < 500ms
- ✅ 保持滚动位置
- ✅ 保持客户端状态（打开的 Modal 等）

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| router.refresh() 不刷新数据 | 中 | 低 | 添加回退到 location.reload() |
| 乐观更新后 API 失败 | 中 | 低 | 失败时恢复状态 |
| Modal Loading 延迟 | 低 | 低 | 添加骨架屏 |

## 未来增强

- 使用 React Server Actions（Next.js 14+）
- 实时更新（WebSocket）
- 批量操作优化
- 撤销操作支持

## 参考

- [Next.js Router.refresh()](https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Optimistic UI Updates](https://www.patterns.dev/posts/optimistic-ui)
