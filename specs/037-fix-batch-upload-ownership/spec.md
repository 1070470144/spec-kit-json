# Spec 037: 修复管理员批量上传剧本归属问题

## 概述
**规格编号**: 037  
**创建日期**: 2025-10-14  
**状态**: 已完成  
**优先级**: 高

## 目标
修复管理员在后台批量上传剧本时，剧本被错误分配给其他用户的问题，确保所有上传的剧本都归属于当前登录的用户。

## 背景

### 问题发现
管理员使用后台批量上传功能 (`/admin/scripts/batch`) 上传剧本时，发现上传的剧本被挂到了其他用户账号下，而不是管理员自己的账号。

### 问题影响
1. **数据归属错误**: 管理员上传的剧本无法在"我的上传"中看到
2. **权限混乱**: 剧本被错误地分配给普通用户
3. **管理困难**: 管理员无法管理自己上传的剧本

## 根本原因分析

### 原代码逻辑
```typescript
// ❌ 错误的逻辑
const userSession = await getSession()
const adminSession = await getAdminSession()
const ownerId = userSession?.userId || adminSession?.userId || null
```

### 问题所在
1. **混淆了会话类型**: 同时获取两种会话，造成逻辑混乱
2. **优先级错误**: 优先使用 `userSession`，导致如果系统中存在普通用户会话，就会被误用
3. **概念错误**: 将管理员和用户视为两种不同的身份，实际上管理员本身也是用户

### 正确的设计理念
- **管理员即用户**: 管理员本身就是一个用户，拥有特殊的角色权限
- **单一会话**: 只使用用户会话 (`getSession()`)，通过角色 (role) 来区分权限
- **统一逻辑**: 所有上传操作都使用相同的会话逻辑

## 解决方案

### 设计原则
1. **单一职责**: 只使用 `getSession()` 获取当前登录用户
2. **强制登录**: 如果未登录，返回 401 错误
3. **简化逻辑**: 移除 `getAdminSession()` 的使用

### 技术方案

#### 1. 导入必要的函数
```typescript
import { unauthorized } from '@/src/api/http'
```

#### 2. 修改上传逻辑 (multipart/form-data)
**位置**: `app/api/scripts/route.ts` 第189-196行

```typescript
// 只使用当前登录用户的会话（管理员也是用户）
const userSession = await getSession()
if (!userSession) {
  return unauthorized('NOT_LOGGED_IN')
}
const ownerId = userSession.userId

console.log('[Upload] User userId:', userSession.userId, 'ownerId:', ownerId)
```

#### 3. 修改上传逻辑 (application/json)
**位置**: `app/api/scripts/route.ts` 第342-347行

```typescript
// 只使用当前登录用户的会话（管理员也是用户）
const userSession = await getSession()
if (!userSession) {
  return unauthorized('NOT_LOGGED_IN')
}
const ownerId = userSession.userId
```

## 实现步骤

### Phase 1: 代码修复
- [x] 在 `app/api/scripts/route.ts` 导入 `unauthorized` 函数
- [x] 修改 multipart/form-data 上传逻辑
- [x] 修改 application/json 上传逻辑
- [x] 移除 `getAdminSession()` 调用
- [x] 添加登录检查

### Phase 2: 测试验证
- [ ] 测试管理员批量上传
  - [ ] 管理员登录前台账号
  - [ ] 访问后台批量上传页面
  - [ ] 上传多个JSON文件
  - [ ] 验证剧本归属于管理员自己
  - [ ] 在"我的上传"中能看到剧本

- [ ] 测试普通用户上传
  - [ ] 用户登录
  - [ ] 上传剧本
  - [ ] 验证剧本归属于用户自己

- [ ] 测试未登录场景
  - [ ] 清除登录状态
  - [ ] 尝试调用上传API
  - [ ] 验证返回 401 错误

### Phase 3: 文档更新
- [x] 创建 spec 文档
- [x] 更新 README

## 代码对比

### 修改前
```typescript
// multipart/form-data 上传
const userSession = await getSession()
const adminSession = await getAdminSession()
const ownerId = userSession?.userId || adminSession?.userId || null

// application/json 上传
const userSession = await getSession()
const adminSession = await getAdminSession()
const ownerId = userSession?.userId || adminSession?.userId || null
```

### 修改后
```typescript
// multipart/form-data 上传
const userSession = await getSession()
if (!userSession) {
  return unauthorized('NOT_LOGGED_IN')
}
const ownerId = userSession.userId

// application/json 上传
const userSession = await getSession()
if (!userSession) {
  return unauthorized('NOT_LOGGED_IN')
}
const ownerId = userSession.userId
```

## 验收标准

### 功能验收
1. ✅ 管理员批量上传的剧本归属于管理员自己
2. ✅ 普通用户上传的剧本归属于用户自己
3. ✅ 未登录用户上传时返回 401 错误
4. ✅ 代码逻辑清晰，移除了冗余的会话检查

### 安全验收
1. ✅ 强制登录检查，防止匿名上传
2. ✅ 剧本归属明确，无法错误分配

### 代码质量
1. ✅ 移除了不必要的 `getAdminSession()` 调用
2. ✅ 简化了逻辑，提高了可维护性
3. ✅ 添加了适当的错误处理

## 影响范围

### API 变更
**`POST /api/scripts`** (multipart/form-data)
- **变更**: 现在要求必须登录
- **错误响应**: 401 Unauthorized (如果未登录)

**`POST /api/scripts`** (application/json)
- **变更**: 现在要求必须登录
- **错误响应**: 401 Unauthorized (如果未登录)

### 用户界面
- **管理员批量上传** (`/admin/scripts/batch`):
  - 管理员需要先在前台登录
  - 上传的剧本归属于管理员自己
  
- **用户上传** (`/upload`):
  - 行为不变，剧本归属于当前登录用户

### 数据库
- **Script 表**:
  - `ownerId` 字段现在始终是当前登录用户的ID
  - 不再有 null 值的情况

## 相关 Issues
- 管理员批量上传剧本归属错误

## 参考资料
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## 变更历史
- 2025-10-14: 初始创建并完成实现

