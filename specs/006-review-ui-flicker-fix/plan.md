# Implementation Plan: 审核界面 UI 闪烁修复

**Branch**: `[006-review-ui-flicker-fix]` | **Date**: 2025-09-30 | **Spec**: specs/006-review-ui-flicker-fix/spec.md  
**Type**: Bug Fix + UX Improvement | **Priority**: High

## Summary
修复剧本审核界面在操作（通过/拒绝）后的 UI 闪烁问题。使用 Next.js router.refresh() 替代 location.reload()，添加 Modal Loading 状态，实现平滑的 UI 更新。

## Technical Context
- Framework: Next.js 14+ (App Router)
- Problem: `location.reload()` 导致整页刷新和白屏闪烁
- Solution: `router.refresh()` 仅刷新 Server Component 数据
- Components: ReviewItem, ReviewDetailModal, ReviewActions (Client Components)
- Page: admin/review/page.tsx (Server Component)

## Problem Analysis

### 闪烁原因分析

#### 1. location.reload() 导致整页刷新
```typescript
// ReviewItem.tsx:11, 16
if (res.ok) location.reload()  // ❌ 问题
```

**影响**:
- 整个页面白屏重载
- 所有客户端状态丢失
- 滚动位置丢失
- 网络请求重新发起
- 用户体验差

#### 2. Modal 无 Loading 状态
```typescript
// ReviewDetailModal.tsx
const [detail, setDetail] = useState<Detail | null>(null)
// 直接渲染，null 时显示 "..."
<div>{detail?.title || '...'}</div>
```

**影响**:
- 打开 Modal 时短暂显示 "..."
- 数据加载完成后突然变化
- 视觉不连贯

#### 3. 无乐观更新
- 操作后等待服务器响应再刷新
- 用户需要等待才能看到结果
- 体验不够流畅

## Solution Design

### 解决方案 1: router.refresh()

**原理**:
- Next.js App Router 提供的 API
- 仅重新获取 Server Component 数据
- 保持客户端组件状态
- 无白屏，平滑过渡

**实现**:
```typescript
'use client'
import { useRouter } from 'next/navigation'

export default function ReviewItem({ id, title, author }) {
  const router = useRouter()
  
  async function approve() {
    const res = await fetch(`/api/scripts/${id}/review`, ...)
    if (res.ok) {
      router.refresh()  // ✅ 仅刷新数据
    }
  }
}
```

### 解决方案 2: Modal Loading 状态

**实现**:
```typescript
const [loading, setLoading] = useState(false)
const [detail, setDetail] = useState<Detail | null>(null)

useEffect(() => {
  if (!open) return
  setLoading(true)
  setDetail(null)
  
  async function load() {
    try {
      // ... fetch data
      if (!aborted) setDetail(data)
    } finally {
      if (!aborted) setLoading(false)
    }
  }
  load()
}, [id, open])

// 渲染
{loading && <LoadingSpinner />}
{!loading && detail && <Content />}
```

### 解决方案 3: 操作反馈优化

**添加 Toast 通知**（可选）:
```typescript
import { emitToast } from '@/app/_components/Toaster'

async function approve() {
  const res = await fetch(...)
  if (res.ok) {
    emitToast('审核通过', 'success')
    router.refresh()
  } else {
    emitToast('操作失败', 'error')
  }
}
```

## Implementation Steps

### Phase 1: ReviewItem 修复
- 导入 `useRouter`
- 替换 `location.reload()` → `router.refresh()`
- 添加操作反馈（可选）

### Phase 2: ReviewDetailModal 修复
- 添加 `loading` 状态
- 添加 Loading UI
- 优化数据加载逻辑

### Phase 3: ReviewActions 修复
- 使用 `router.refresh()`
- 优化错误处理

### Phase 4: 一键通过优化
- 添加 Loading 状态
- 优化用户反馈

## Performance Impact

### Before
- 整页刷新：~1-2s
- 白屏时间：~500ms
- 用户等待：明显

### After
- 数据刷新：~200-500ms
- 无白屏
- 用户等待：几乎无感知

## Constitution Check

### ✅ 性能
- 减少不必要的页面刷新
- 优化数据加载
- 提升响应速度

### ✅ 用户体验
- 消除白屏闪烁
- 平滑的状态过渡
- 即时的操作反馈

### ✅ 代码质量
- 使用 Next.js 推荐的 API
- 清晰的状态管理
- 优雅的错误处理

评估：符合要求，可执行。

## Testing Strategy

### 测试场景

1. **通过审核**:
   - 点击通过按钮
   - 验证无白屏闪烁
   - 验证列表更新
   - 验证滚动位置保持

2. **拒绝审核**:
   - 输入拒绝理由
   - 点击拒绝按钮
   - 验证无白屏闪烁
   - 验证列表更新

3. **打开 Modal**:
   - 点击卡片打开 Modal
   - 验证有 Loading 状态
   - 验证数据加载流畅

4. **一键通过全部**:
   - 点击一键通过按钮
   - 验证有 Loading 反馈
   - 验证列表更新

## Rollback Plan

如果 router.refresh() 有问题：
- 恢复 location.reload()
- 或使用完整的客户端状态管理

## Progress Tracking

**Phase Status**:
- [x] Problem Analysis Complete
- [x] Solution Designed
- [ ] Implementation Complete
- [ ] Testing Complete

## Next Steps
1. 生成任务清单（/tasks）
2. 实施修复
3. 测试验证
