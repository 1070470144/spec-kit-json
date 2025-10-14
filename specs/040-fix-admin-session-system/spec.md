# 040 - 修复管理后台会话系统

## 📋 问题描述

管理后台登录成功后立即被重定向回登录页，用户列表返回401错误。

## 🔍 根本原因

**会话系统不一致**：
- **登录时**：设置 `admin_session` Cookie
- **Middleware验证**：检查 `session` Cookie ❌
- **API验证**：使用 `getAdminSession()` 读取 `admin_session` Cookie ✅

**结果**：Cookie 名称不匹配导致验证失败

---

## 🔧 修复方案

### 修复的文件清单

#### 1. `middleware.ts` ⭐（关键修复）
```typescript
// 修复前：
const token = req.cookies.get('session')?.value

// 修复后：
const token = req.cookies.get('admin_session')?.value
```

**修复内容**：
- 第25行：登录页面检查 `admin_session`
- 第37行：管理页面验证 `admin_session`

#### 2. `app/api/admin/auth/login/route.ts`
```typescript
// 修复前：
import { signSession, setSessionCookie } from '@/src/auth/session'
const token = signSession(...)
await setSessionCookie(token)

// 修复后：
import { signAdminSession, setAdminSessionCookie } from '@/src/auth/adminSession'
const token = signAdminSession(...)
await setAdminSessionCookie(token)
```

#### 3. `app/api/admin/auth/logout/route.ts`
```typescript
// 修复前：
import { clearSessionCookie } from '@/src/auth/session'
await clearSessionCookie()

// 修复后：
import { clearAdminSessionCookie } from '@/src/auth/adminSession'
await clearAdminSessionCookie()
```

#### 4. `app/api/admin/auth/me/route.ts`
```typescript
// 修复前：
import { getSession } from '@/src/auth/session'
const sess = await getSession()
if (sess.role !== 'admin') return forbidden('NOT_ADMIN')

// 修复后：
import { getAdminSession } from '@/src/auth/adminSession'
const sess = await getAdminSession()
// role 验证已内置在 getAdminSession 中
```

---

## 🎯 修复效果

### 修复前
```
1. 用户登录 → 设置 admin_session Cookie
2. 访问管理页面 → Middleware 检查 session Cookie
3. Cookie 不存在 → 重定向回登录页 ❌
```

### 修复后
```
1. 用户登录 → 设置 admin_session Cookie
2. 访问管理页面 → Middleware 检查 admin_session Cookie
3. Cookie 验证成功 → 显示管理页面 ✅
```

---

## 📊 测试清单

### 部署后测试

- [ ] 清理浏览器缓存和Cookie
- [ ] 重新登录管理后台
- [ ] 能够停留在管理页面（不被重定向）
- [ ] 用户列表 API 返回200（不是401）
- [ ] 管理后台所有页面正常访问
- [ ] 所有管理功能正常工作

---

## 📝 部署步骤

### 服务器上需要更新的文件

1. `middleware.ts`
2. `app/api/admin/auth/login/route.ts`
3. `app/api/admin/auth/logout/route.ts`
4. `app/api/admin/auth/me/route.ts`

### 部署流程

```powershell
# 1. 上传修复文件到服务器
# 2. 在服务器上：
cd C:\apps\juben
npx pm2 stop juben
npm run build
npx pm2 start juben

# 3. 清理浏览器缓存重新登录测试
```

---

## ✅ 验收标准

1. ✅ 登录后能正常访问管理后台页面
2. ✅ 不会被重定向回登录页
3. ✅ 用户列表正常显示
4. ✅ 所有管理功能正常工作
5. ✅ Cookie 使用 `admin_session` 名称
6. ✅ API 返回200而不是401

---

## 🎉 修复完成

**问题原因**：管理员会话系统使用了两套不一致的Cookie机制
**解决方案**：统一使用 `admin_session` Cookie
**影响范围**：管理后台登录和权限验证
**修复文件**：4个关键文件

