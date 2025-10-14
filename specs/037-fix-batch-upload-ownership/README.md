# Spec 037: 修复管理员批量上传剧本归属问题

## 问题描述
管理员在后台批量上传剧本时，剧本被错误地分配给了其他用户，而不是管理员自己。

## 根本原因

系统存在**双会话机制**的设计缺陷：

1. **管理员后台登录** → 只设置 `admin_session` cookie
2. **前台用户登录** → 只设置 `session` cookie
3. **上传API** → 只检查 `session` cookie

**问题**：管理员通过后台登录后，没有 `session` cookie，导致：
- 批量上传时返回 401 错误
- 或者如果系统中有其他用户的 `session`，剧本会被错误分配

**错误逻辑**：
```typescript
const userSession = await getSession()
const adminSession = await getAdminSession()
const ownerId = userSession?.userId || adminSession?.userId || null
```

这个逻辑尝试兼容两种会话，但实际上管理员后台登录时只有 `admin_session`，没有 `session`。

## 解决方案

**采用双会话统一方案**：

### 方案：管理员后台登录时同时设置两个cookie

**核心思路**：
- 管理员本身也是一个用户
- 管理员后台登录时，同时设置 `admin_session` 和 `session` 两个cookie
- `admin_session` 用于后台权限验证
- `session` 用于前台功能（如上传剧本）
- 上传API只需检查 `session`，逻辑统一

**修复后的逻辑**：

1. **上传API** (`/api/scripts`):
```typescript
// 只使用当前登录用户的会话（管理员也是用户）
const userSession = await getSession()
if (!userSession) {
  return unauthorized('NOT_LOGGED_IN')
}
const ownerId = userSession.userId
```

2. **管理员登录** (`/api/admin/auth/login`):
```typescript
// 生成管理员会话token（用于后台访问）
const adminToken = signAdminSession({ userId: user.id, email: user.email, role: 'admin' })

// 同时生成普通用户会话token（用于前台功能，如上传剧本）
const userToken = signSession({ userId: user.id, email: user.email, role: 'admin' })
await setSessionCookie(userToken)

// 设置两个cookie
res.cookies.set('admin_session', adminToken, ...)
```

3. **管理员登出** (`/api/admin/auth/logout`):
```typescript
// 同时清除两个会话
await clearAdminSessionCookie()
await clearSessionCookie()
```

## 技术实现

### 修改的文件
- `app/api/scripts/route.ts` - 上传API，统一使用 `getSession()`
- `app/api/admin/auth/login/route.ts` - 管理员登录，同时设置两个cookie
- `app/api/admin/auth/logout/route.ts` - 管理员登出，同时清除两个cookie

### 具体修改

1. **导入 `unauthorized` 函数**
```typescript
import { ok, unsupportedMediaType, badRequest, tooLarge, internalError, forbidden, unauthorized } from '@/src/api/http'
```

2. **修改 multipart/form-data 上传逻辑** (第189-196行)
```typescript
// 只使用当前登录用户的会话（管理员也是用户）
const userSession = await getSession()
if (!userSession) {
  return unauthorized('NOT_LOGGED_IN')
}
const ownerId = userSession.userId

console.log('[Upload] User userId:', userSession.userId, 'ownerId:', ownerId)
```

3. **修改 application/json 上传逻辑** (第342-347行)
```typescript
// 只使用当前登录用户的会话（管理员也是用户）
const userSession = await getSession()
if (!userSession) {
  return unauthorized('NOT_LOGGED_IN')
}
const ownerId = userSession.userId
```

## 使用流程

### 管理员批量上传
1. 管理员在前台登录（使用自己的用户账号）
2. 访问后台批量上传页面 `/admin/scripts/batch`
3. 选择JSON文件进行批量上传
4. 所有剧本归属于当前登录的管理员用户

### 普通用户上传
1. 用户在前台登录
2. 访问上传页面 `/upload`
3. 上传剧本
4. 剧本归属于当前登录的用户

### 未登录用户
- 访问上传API时返回 401 Unauthorized
- 前端应重定向到登录页面

## 验收标准

- [x] 修复上传API逻辑，统一使用 `getSession()`
- [x] 修改管理员登录，同时设置两个cookie
- [x] 修改管理员登出，同时清除两个cookie
- [x] 添加登录检查和 `unauthorized` 错误处理
- [ ] 测试管理员后台登录，验证同时获得两个cookie
- [ ] 测试管理员批量上传，剧本应归属于管理员自己
- [ ] 测试普通用户上传，剧本应归属于用户自己
- [ ] 测试管理员登出，验证两个cookie都被清除
- [ ] 测试未登录用户上传，应返回 401 错误

## 影响范围

### API 变更
- ✅ `/api/scripts` POST (multipart/form-data) - 现在要求必须登录
- ✅ `/api/scripts` POST (application/json) - 现在要求必须登录

### 用户体验
- ✅ 管理员批量上传的剧本正确归属于管理员
- ✅ 普通用户上传的剧本正确归属于用户
- ✅ 未登录用户会收到明确的错误提示

## 相关文档
- [完整规格说明](./spec.md)

## 变更历史
- 2025-10-14: 初始创建，修复批量上传归属问题

