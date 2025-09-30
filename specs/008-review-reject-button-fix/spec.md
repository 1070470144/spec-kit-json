# Spec: 审核拒绝按钮修复

**ID**: 008-review-reject-button-fix  
**Created**: 2025-09-30  
**Status**: Draft  
**Priority**: Critical  
**Type**: Bug Fix

## 问题描述

在审核详情 Modal 中，点击"拒绝"按钮没有任何反应，用户无法拒绝剧本。

### 复现步骤
1. 打开审核详情 Modal
2. 不填写拒绝理由（或填写）
3. 点击"拒绝"按钮
4. **无任何反应**

## 根本原因分析

### 原因：缺少用户反馈

查看 `ReviewItem.tsx` 第 15-19 行：
```typescript
async function reject(reason: string) {
  if (!reason.trim()) return  // ❌ 静默失败，无提示
  const res = await fetch(`/api/scripts/${id}/review`, ...)
  if (res.ok) router.refresh()
}
```

**问题**:
1. 如果用户未填写拒绝理由 → 函数直接 return
2. 没有任何提示告知用户需要填写理由
3. 没有 loading 状态
4. 没有错误提示
5. API 调用失败也没有反馈

## 解决方案

### 方案 1: 添加状态和提示（推荐）

```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

async function reject(reason: string) {
  setError('')
  
  // 验证拒绝理由
  if (!reason.trim()) {
    setError('请填写拒绝理由')
    return
  }
  
  setLoading(true)
  try {
    const res = await fetch(`/api/scripts/${id}/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'rejected', reason })
    })
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error?.message || '拒绝失败')
      return
    }
    
    // 成功
    setOpen(false)
    router.refresh()
  } catch (err) {
    setError('网络错误，请重试')
  } finally {
    setLoading(false)
  }
}
```

### 方案 2: 在 Modal 中添加验证和反馈

```typescript
// ReviewDetailModal.tsx
const [submitting, setSubmitting] = useState(false)
const [error, setError] = useState('')

async function handleReject() {
  setError('')
  
  if (!reason.trim()) {
    setError('请填写拒绝理由')
    return
  }
  
  setSubmitting(true)
  try {
    await onRejected(reason)
    // 成功后关闭
    onClose()
  } catch (err) {
    setError('操作失败')
  } finally {
    setSubmitting(false)
  }
}

// 按钮
<button 
  className="m3-btn-outlined flex-1" 
  onClick={handleReject}
  disabled={submitting}
>
  {submitting ? '处理中...' : '拒绝'}
</button>

{error && (
  <div className="text-body-small text-error">{error}</div>
)}
```

## 技术实现

### 修复文件

**ReviewDetailModal.tsx** (推荐):
1. 添加 `submitting` 和 `error` 状态
2. 在 Modal 内部处理验证
3. 显示错误提示
4. 添加 loading 状态
5. 成功后自动关闭 Modal

或

**ReviewItem.tsx**:
1. 添加 `loading` 和 `error` 状态
2. reject 函数添加错误处理
3. 将 error 传递给 Modal 显示

## 用户体验改进

### Before (当前)
```
点击拒绝 → 无反应
         ❌ 不知道是否需要填理由
         ❌ 不知道是否在处理
         ❌ 不知道是否成功/失败
```

### After (修复后)
```
点击拒绝 → 验证理由 → 显示"请填写拒绝理由"
         ↓
         填写理由 → 点击拒绝 → "处理中..." → 成功关闭
         ↓
         失败 → 显示错误信息
```

## 成功标准

- ✅ 未填写理由时显示提示
- ✅ 点击拒绝有 loading 状态
- ✅ API 失败有错误提示
- ✅ 成功后自动关闭 Modal
- ✅ 列表自动刷新

## 参考

- [规格 007 - 审核界面 M3 优化](../007-review-interface-m3/)
