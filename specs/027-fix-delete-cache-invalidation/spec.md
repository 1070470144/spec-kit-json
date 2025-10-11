# Spec 027: 修复删除剧本后缓存不更新问题

## 概述
**规格编号**: 027  
**创建日期**: 2025-10-11  
**状态**: 实施中  

## 目标
修复用户删除剧本（软删除为 abandoned 状态）后，管理员端"已废弃"列表不更新的问题。

## 背景
用户反馈：当用户A上传的剧本审核通过后，在"我的上传"中删除了该剧本。按照设计，该剧本应该进入管理员端的"废弃"列表，但这个功能没有正常工作——管理员端看不到新废弃的剧本。

## 问题分析

### 根本原因
在 `app/api/scripts/[id]/delete/route.ts` 中，用户删除剧本时会将 `state` 更新为 `'abandoned'`：

```typescript
await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })
return ok({ softDeleted: true })
```

**但是**，删除操作后**没有清除相关的缓存**，导致：
1. ❌ 管理员端的"已废弃"列表仍然显示旧的缓存数据
2. ❌ "已通过"列表也显示旧的缓存数据（可能还显示已删除的剧本）
3. ❌ 用户的"我的上传"列表可能也不更新

### 缓存机制分析
在 `app/api/scripts/route.ts` 中：

```typescript
const shouldCache = !mine && !q // 公共列表和无搜索条件时使用缓存

if (shouldCache) {
  const cachedData = await getCachedData(
    { ...CACHE_CONFIG.SCRIPTS_LIST('list'), key: cacheKey },
    async () => { /* ... */ }
  )
}
```

**缓存键格式**：
```
scripts-{state}-{query}-{mine/public}-{page}-{pageSize}
```

例如：
- `scripts-published-noquery-public-1-20`
- `scripts-abandoned-noquery-public-1-20`
- `scripts-pending-noquery-public-1-20`

### 问题症状
1. 用户删除剧本后，剧本的 `state` 在数据库中正确更新为 `'abandoned'`
2. 但管理员访问"已废弃"列表时，看到的是缓存的旧数据（不包含新删除的剧本）
3. "已通过"列表也可能还显示已删除的剧本（因为缓存未清除）

## 解决方案

### 方案 1：删除时清除所有相关缓存（推荐）
在删除/软删除操作后，清除所有与剧本列表相关的缓存。

```typescript
import { invalidateCache } from '@/src/cache/api-cache'

// 软删除后清除缓存
await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })

// 清除所有状态的剧本列表缓存（使用字符串模式）
invalidateCache('scripts-')

return ok({ softDeleted: true })
```

**优点**：
- ✅ 简单可靠
- ✅ 确保所有相关列表都能看到最新数据
- ✅ 不会遗漏任何需要更新的缓存

**缺点**：
- ⚠️ 清除了所有列表缓存，可能影响性能（但可接受）

### 方案 2：精确清除特定状态的缓存
只清除受影响的特定状态的缓存。

```typescript
// 获取剧本的旧状态
const script = await prisma.script.findUnique({ where: { id }, select: { state: true } })
const oldState = script?.state

// 软删除
await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })

// 清除旧状态和新状态的缓存
await invalidateCache({ tags: [`scripts-list-${oldState}`, 'scripts-list-abandoned'] })
```

**优点**：
- ✅ 精确清除，不影响其他状态的缓存

**缺点**：
- ⚠️ 需要额外的数据库查询
- ⚠️ 逻辑更复杂，容易出错

### 推荐方案
使用方案 1：删除时清除所有剧本列表缓存。理由：
1. 简单可靠
2. 删除操作不频繁，性能影响可接受
3. 确保数据一致性

## 实现步骤

### Phase 1: 添加缓存清除逻辑
- [x] 在 `/api/scripts/[id]/delete` 中导入缓存清除函数
- [x] 在软删除后清除缓存
- [x] 在硬删除后清除缓存

### Phase 2: 测试验证
- [ ] 测试用户删除剧本后，管理员端"已废弃"列表能看到
- [ ] 测试"已通过"列表不再显示已删除的剧本
- [ ] 测试管理员硬删除后，列表也正确更新

### Phase 3: 其他相关操作
检查其他可能需要清除缓存的操作：
- [ ] 审核通过/拒绝操作
- [ ] 创建剧本操作
- [ ] 更新剧本操作

## 代码修改

### app/api/scripts/[id]/delete/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, unauthorized } from '@/src/api/http'
import { getSession } from '@/src/auth/session'
import { getAdminSession } from '@/src/auth/adminSession'
import { invalidateCache } from '@/src/cache/api-cache' // 新增

// 普通用户：软删除（标记 state = 'abandoned'），管理员：硬删除
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const admin = await getAdminSession()
  if (admin) {
    const exist = await prisma.script.findUnique({ where: { id }, select: { id: true } })
    if (!exist) return notFound()
    await prisma.$transaction(async (tx) => {
      await tx.imageAsset.deleteMany({ where: { scriptId: id } })
      await tx.scriptJSON.deleteMany({ where: { scriptId: id } })
      await tx.review.deleteMany({ where: { scriptId: id } })
      await tx.downloadEvent.deleteMany({ where: { scriptId: id } })
      await tx.like.deleteMany({ where: { scriptId: id } })
      await tx.favorite.deleteMany({ where: { scriptId: id } })
      await tx.script.delete({ where: { id } })
    })
    
    // 清除缓存（新增）
    invalidateCache('scripts-')
    console.log('[Delete] Cache invalidated for hard delete')
    
    return ok({ hardDeleted: true })
  }

  const session = await getSession()
  if (!session) return unauthorized()
  const mine = await prisma.script.findFirst({ where: { id, createdById: session.userId }, select: { id: true } })
  if (!mine) return unauthorized()
  await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })
  
  // 清除缓存（新增）
  invalidateCache('scripts-')
  console.log('[Delete] Cache invalidated for soft delete, script:', id)
  
  return ok({ softDeleted: true })
}
```

## 验收标准

### 功能验收
1. ✅ 用户删除已通过的剧本后，管理员端"已废弃"列表立即显示该剧本
2. ✅ "已通过"列表不再显示已删除的剧本
3. ✅ 管理员硬删除后，列表正确更新

### 性能验收
1. ✅ 删除操作响应时间 < 500ms
2. ✅ 缓存清除不影响其他操作

## 风险与限制

### 已知限制
1. **缓存清除范围**: 清除所有剧本列表缓存，可能影响其他用户的查询性能（首次查询会慢一点）

### 风险缓解
1. 删除操作不频繁，性能影响可接受
2. 缓存会在下次查询时自动重建

## 相关资源
- 删除 API: `app/api/scripts/[id]/delete/route.ts`
- 列表 API: `app/api/scripts/route.ts`
- 缓存工具: `src/cache/api-cache.ts`

## 后续优化
如果删除操作变得频繁，可以考虑：
1. 使用更精细的缓存标签（按状态分开）
2. 使用增量缓存更新而不是完全清除
3. 使用数据库触发器或事件系统自动清除缓存

## 变更历史
- 2025-10-11: 初始创建

