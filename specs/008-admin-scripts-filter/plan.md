# Implementation Plan: 管理员剧本列表状态筛选增强

**Branch**: `[008-admin-scripts-filter]` | **Date**: 2025-09-30 | **Spec**: specs/008-admin-scripts-filter/spec.md

## Summary
在管理员剧本列表页面增加完整的状态筛选，支持待审核、已通过、已拒绝、已废弃四种状态，优化管理员的剧本管理效率。

## Technical Context
- Language: TypeScript
- Framework: Next.js (App Router, Server Component)
- Data: Prisma (Script.state 字段)
- Current: 仅支持 published/abandoned 筛选
- Solution: 添加 pending/rejected 筛选

## Current Implementation

### 现有筛选
```typescript
// /admin/scripts (默认) → 已发布
// /admin/scripts?state=abandoned → 已废弃
```

问题：
- ❌ 无法查看待审核剧本
- ❌ 无法查看已拒绝剧本
- ❌ 默认状态对管理员不友好（应该看待审核）

## Solution Design

### 状态定义
```typescript
const states = [
  { value: 'pending', label: '待审核' },
  { value: 'published', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'abandoned', label: '已废弃' },
]
```

### URL 设计
```
/admin/scripts?state=pending     → 待审核（新增）
/admin/scripts?state=published   → 已通过（修改）
/admin/scripts?state=rejected    → 已拒绝（新增）
/admin/scripts?state=abandoned   → 已废弃（保持）
```

### 默认行为
```typescript
// 修改前
const state = sp?.state  // undefined → 默认查询已发布

// 修改后
const state = sp?.state || 'pending'  // 默认显示待审核
```

## Implementation Steps

### Phase 1: 修改筛选按钮
- 扩展状态数组（4 个状态）
- 使用 map 渲染筛选按钮
- 应用 M3 Segmented Button 样式

### Phase 2: 修改默认状态
- 默认值改为 'pending'
- 确保 API 调用正确

### Phase 3: 优化空状态
- 根据当前状态显示不同提示
- 优化文案和图标

## Constitution Check

### ✅ Material 3 统一
- 使用 M3 Segmented Button
- 保持视觉一致性

### ✅ 用户体验
- 默认显示最重要的内容（待审核）
- 筛选直观易用
- 空状态友好

### ✅ 代码质量
- 使用数据驱动渲染
- 减少重复代码
- 易于扩展

评估：符合要求，可执行。

## Testing Strategy

### 测试用例
1. 访问 `/admin/scripts` → 显示待审核
2. 点击"已通过" → 显示 published 剧本
3. 点击"已拒绝" → 显示 rejected 剧本
4. 点击"已废弃" → 显示 abandoned 剧本
5. 分页跳转 → 保持筛选状态

## Progress Tracking

- [x] Problem Analysis
- [x] Solution Design
- [ ] Implementation
- [ ] Testing
