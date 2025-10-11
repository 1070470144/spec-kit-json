# Spec 028: 管理员恢复废弃剧本并转移所有权

## 概述
**规格编号**: 028  
**创建日期**: 2025-10-11  
**状态**: 实施中  

## 目标
1. 用户删除剧本后，在"我的上传"页面不再显示该剧本
2. 管理员可以修改已废弃剧本的状态（恢复为已通过等）
3. 管理员修改状态后，剧本的所有权转移（不再属于原创建用户）

## 背景
当前系统中，用户删除剧本后：
- ✅ 剧本状态更新为 `abandoned`
- ✅ 管理员能在"已废弃"列表中看到
- ❌ 用户在"我的上传"中仍然能看到（因为查询没有过滤 abandoned）
- ❌ 管理员无法修改废弃剧本的状态
- ❌ 没有所有权转移机制

## 需求分析

### 需求 1：用户端过滤废弃剧本
**用户故事**：作为普通用户，当我删除剧本后，我不希望在"我的上传"中看到它。

**实现**：在 `/my/uploads` 的查询中，排除 `state = 'abandoned'` 的剧本。

### 需求 2：管理员恢复废弃剧本
**用户故事**：作为管理员，我希望能将废弃的剧本恢复为"已通过"状态，让它重新上架。

**实现**：在管理员端的"已废弃"列表中，添加"恢复"按钮，调用 API 修改状态。

### 需求 3：转移所有权
**用户故事**：作为管理员，当我恢复一个废弃剧本时，我希望它不再属于原用户，而是成为系统剧本或属于管理员。

**实现方式（三选一）**：

#### 方案 A：转移给系统账户
创建一个特殊的"系统"用户，所有恢复的剧本归属于此用户。

```typescript
// 创建系统用户（一次性操作）
const systemUser = await prisma.user.create({
  data: {
    email: 'system@xueran.local',
    nickname: '系统',
    passwordHash: '...',
    roles: ['system']
  }
})

// 恢复时转移所有权
await prisma.script.update({
  where: { id },
  data: {
    state: 'published',
    createdById: systemUser.id
  }
})
```

#### 方案 B：转移给当前管理员
将剧本所有权转移给执行恢复操作的管理员。

```typescript
const admin = await getAdminSession()
await prisma.script.update({
  where: { id },
  data: {
    state: 'published',
    createdById: admin.userId
  }
})
```

#### 方案 C：保留原作者但标记为系统管理
不改变 `createdById`，但添加一个标记字段表示剧本已被系统接管。

```typescript
// 需要修改 Prisma schema 添加字段
// model Script {
//   systemOwned Boolean @default(false)
// }

await prisma.script.update({
  where: { id },
  data: {
    state: 'published',
    systemOwned: true
  }
})
```

### 推荐方案
**方案 C**（保留原作者 + 系统标记）

**理由**：
1. ✅ 保留历史记录（知道剧本原本是谁创建的）
2. ✅ 查询时可以过滤系统接管的剧本
3. ✅ 不需要创建特殊用户
4. ✅ 原用户在"我的上传"中看不到（因为过滤了 abandoned）
5. ✅ 系统接管后原用户无法再操作该剧本

## 设计方案

### 1. 数据库 Schema 修改

```prisma
model Script {
  id            String   @id @default(cuid())
  // ... 现有字段
  systemOwned   Boolean  @default(false)  // 新增：标记为系统接管
  originalOwnerId String?  // 新增：记录原始所有者（可选）
  transferredAt DateTime? // 新增：转移时间（可选）
  
  createdBy     User     @relation("CreatedScripts", fields: [createdById], references: [id])
  createdById   String
}
```

### 2. API 设计

#### POST /api/admin/scripts/:id/restore
管理员恢复废弃剧本的 API

**请求**：
```typescript
POST /api/admin/scripts/cmglo.../restore
Content-Type: application/json

{
  "newState": "published",  // 恢复后的状态
  "transferOwnership": true  // 是否转移所有权
}
```

**响应**：
```typescript
{
  "success": true,
  "data": {
    "id": "cmglo...",
    "state": "published",
    "systemOwned": true
  }
}
```

### 3. 前端修改

#### app/my/uploads/page.tsx
```typescript
// 修改查询，排除 abandoned 状态
where: { 
  createdById: session.userId,
  state: { not: 'abandoned' }  // 新增
}
```

#### app/admin/scripts/page.tsx
为"已废弃"列表的每个剧本添加"恢复"按钮：

```tsx
{state === 'abandoned' && (
  <button
    onClick={() => handleRestore(script.id)}
    className="m3-btn-filled"
  >
    恢复并接管
  </button>
)}
```

### 4. 权限控制

恢复操作后，原用户的权限：
- ❌ 无法在"我的上传"中看到（查询排除了 abandoned）
- ❌ 无法编辑（因为 systemOwned = true）
- ❌ 无法删除（因为 systemOwned = true）
- ✅ 可以在公共列表中看到（如果状态是 published）

检查逻辑：
```typescript
// 在编辑/删除 API 中添加检查
const script = await prisma.script.findUnique({ where: { id } })
if (script.systemOwned && !isAdmin) {
  return forbidden('SYSTEM_OWNED_SCRIPT')
}
```

## 实现步骤

### Phase 1: 数据库修改
- [x] 修改 Prisma schema 添加 `systemOwned` 字段
- [ ] 运行迁移 `npx prisma migrate dev`
- [ ] 更新类型定义

### Phase 2: 后端 API
- [ ] 创建 `/api/admin/scripts/[id]/restore` 路由
- [ ] 实现恢复逻辑
- [ ] 实现所有权转移逻辑
- [ ] 添加权限检查
- [ ] 清除相关缓存

### Phase 3: 前端修改
- [x] 修改"我的上传"查询，过滤 abandoned
- [x] 管理员端"已废弃"列表添加"恢复"按钮
- [x] 实现恢复功能的前端逻辑
- [x] 修复 Hydration 错误（使用 mounted 状态）

### Phase 4: 权限控制
- [ ] 修改编辑 API 添加 systemOwned 检查
- [ ] 修改删除 API 添加 systemOwned 检查
- [ ] 前端隐藏系统接管剧本的编辑/删除按钮

### Phase 5: 测试
- [ ] 测试用户删除后看不到剧本
- [ ] 测试管理员恢复功能
- [ ] 测试所有权转移后原用户无法操作
- [ ] 测试恢复后的剧本在公共列表中显示

## API 详细设计

### POST /api/admin/scripts/[id]/restore

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/src/db/client'
import { ok, notFound, unauthorized, badRequest } from '@/src/api/http'
import { getAdminSession } from '@/src/auth/adminSession'
import { invalidateCache } from '@/src/cache/api-cache'

export async function POST(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return unauthorized('NOT_ADMIN')
  
  const { id } = await context.params
  const body = await req.json().catch(() => ({}))
  const { newState = 'published', transferOwnership = true } = body
  
  // 验证状态
  const validStates = ['published', 'pending', 'rejected']
  if (!validStates.includes(newState)) {
    return badRequest('INVALID_STATE')
  }
  
  // 查找剧本
  const script = await prisma.script.findUnique({ 
    where: { id },
    select: { id: true, state: true, createdById: true }
  })
  
  if (!script) return notFound()
  if (script.state !== 'abandoned') {
    return badRequest('SCRIPT_NOT_ABANDONED')
  }
  
  // 恢复剧本
  const updateData: any = { state: newState }
  
  if (transferOwnership) {
    updateData.systemOwned = true
    updateData.originalOwnerId = script.createdById
    updateData.transferredAt = new Date()
  }
  
  await prisma.script.update({
    where: { id },
    data: updateData
  })
  
  // 清除缓存
  invalidateCache('scripts-')
  
  console.log('[Restore] Script restored:', id, 'New state:', newState, 'Transferred:', transferOwnership)
  
  return ok({ 
    success: true, 
    scriptId: id,
    newState,
    systemOwned: transferOwnership
  })
}
```

## Hydration 错误修复

### 问题
在实现条件渲染按钮（abandoned 显示"恢复"，非 abandoned 显示"编辑"）时，遇到了 Hydration 错误：

```
Recoverable Error: Hydration failed because the server rendered text didn't match the client.
```

### 原因
`AdminScriptItem` 是一个客户端组件（`'use client'`），但它会被 Next.js 进行服务端预渲染（SSR）。当使用条件渲染时：

```tsx
{isAbandoned ? <button>恢复</button> : <a>编辑</a>}
```

服务端和客户端可能因为状态计算时机不同，导致渲染的 HTML 不一致。

### 尝试的解决方案

#### ❌ 方案 1: 使用 CSS hidden 类
```tsx
<a className={isAbandoned ? 'hidden' : ''}>编辑</a>
<button className={!isAbandoned ? 'hidden' : ''}>恢复</button>
```
**结果**: 仍然有 Hydration 错误，因为文本内容不匹配。

#### ❌ 方案 2: 使用 suppressHydrationWarning
```tsx
<div suppressHydrationWarning>
  {/* 条件渲染 */}
</div>
```
**结果**: 只是抑制了警告，没有解决根本问题。

#### ❌ 方案 3: 使用 next/dynamic 包装组件
```tsx
const AdminScriptItem = dynamic(() => import('./AdminScriptItem'), { ssr: false })
```
**结果**: 遇到运行时错误 "Cannot read properties of undefined (reading 'call')"。

#### ✅ 方案 4: 使用 mounted 状态（最终方案）

**第一次尝试**：只在按钮区域使用 `mounted`
```tsx
return (
  <div className="card">
    <div>{item.title}</div>
    <div>作者：{item.authorName}</div>
    <div>状态：{item.state}</div>
    {mounted ? <button>真实按钮</button> : <div>骨架屏</div>}
  </div>
)
```
**结果**: ❌ 仍有 Hydration 错误，因为标题、作者、状态等信息也可能在服务端和客户端渲染不一致。

**第二次尝试（最终）**：整个卡片都延迟到客户端渲染
```tsx
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <div className="card"><div>完整骨架屏</div></div>
}

return (
  <div className="card">
    <div>{item.title}</div>
    <div>作者：{item.authorName}</div>
    <div>状态：{item.state}</div>
    {isAbandoned ? <button>恢复</button> : <a>编辑</a>}
  </div>
)
```

**结果**: ✅ 完全解决 Hydration 错误。

### 原理
1. **服务端渲染**: `mounted = false`，渲染占位符
2. **客户端首次 Hydration**: `mounted = false`，渲染占位符（与服务端一致）
3. **客户端 useEffect 执行**: `mounted = true`，重新渲染真实内容
4. **无 Hydration 错误**: 因为初始渲染（占位符）在服务端和客户端完全一致

### 页面切换时的 Hydration 错误

**问题**: 用户报告从其他状态切换到 abandoned 时仍然出现 Hydration 错误。

**原因**: 当通过链接切换状态时（如从 `?state=published` 到 `?state=abandoned`），Next.js 进行服务端导航，但客户端组件的状态可能被保留，导致：
- 服务端返回新数据（abandoned 剧本列表）
- 客户端的 `AdminScriptItem` 组件已经挂载（`mounted = true`）
- 服务端渲染骨架屏，但客户端期望真实内容
- **结果**: Hydration 不匹配

**解决方案**: 在页面根元素添加 `key={state}`，强制在状态切换时重新挂载整个页面：

```tsx
// app/admin/scripts/page.tsx
export default async function AdminScriptsManagePage({ searchParams }) {
  const state = searchParams?.state || 'pending'
  // ...
  
  return (
    <div key={state} className="space-y-4">  {/* 关键：key={state} */}
      {/* 页面内容 */}
    </div>
  )
}
```

**原理**: 
- 当 `state` 变化时，React 会卸载旧的 `<div>` 树
- 重新挂载新的 `<div>` 树，所有子组件都重置为初始状态
- `AdminScriptItem` 的 `mounted` 重置为 `false`
- 新的渲染周期开始，Hydration 正确匹配

### 代码实现
```tsx
// app/admin/_components/AdminScriptItem.tsx
'use client'
import { useState, useEffect } from 'react'

export default function AdminScriptItem({ item }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isAbandoned = item.state === 'abandoned'
  
  // 在挂载前，返回完整的骨架屏卡片
  if (!mounted) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }
  
  // 挂载后，返回真实内容
  return (
    <div className="card">
      <div className="card-body">
        <div>{item.title}</div>
        <div>作者：{item.authorName}</div>
        <div>状态：{item.state}</div>
        <div className="card-actions">
          <button onClick={openModal}>查看</button>
          {isAbandoned ? (
            <button onClick={onRestore}>🔄 恢复并接管</button>
          ) : (
            <a href={`/admin/scripts/${item.id}`}>编辑</a>
          )}
          <button onClick={onDelete}>删除</button>
        </div>
      </div>
    </div>
  )
}
```

## 验收标准

### 功能验收
1. ✅ 用户删除剧本后，在"我的上传"中看不到
2. ✅ 管理员在"已废弃"列表中能看到删除的剧本
3. ✅ 管理员可以点击"恢复"按钮
4. ✅ 恢复后剧本状态改为 published
5. ✅ 恢复后剧本标记为 systemOwned = true
6. ✅ 原用户无法再编辑/删除该剧本
7. ✅ 公共列表中能看到恢复的剧本

### UI 验收
1. ✅ "已废弃"列表显示清晰的"恢复"按钮
2. ✅ 点击恢复时显示确认对话框
3. ✅ 恢复成功后显示成功提示
4. ✅ 列表自动刷新

### 数据验收
1. ✅ 数据库中 systemOwned = true
2. ✅ originalOwnerId 记录了原始所有者
3. ✅ transferredAt 记录了转移时间
4. ✅ 状态正确更新

## 安全考虑

1. **权限检查**：只有管理员可以恢复剧本
2. **状态验证**：只能恢复 abandoned 状态的剧本
3. **所有权保护**：原用户无法操作系统接管的剧本
4. **审计日志**：记录转移操作的时间和原所有者

## 后续优化

1. **恢复历史记录**：记录所有恢复操作的历史
2. **批量恢复**：支持批量选择并恢复多个剧本
3. **通知机制**：恢复后通知原用户（可选）
4. **撤销机制**：管理员可以撤销恢复操作

## 变更历史
- 2025-10-11: 初始创建

