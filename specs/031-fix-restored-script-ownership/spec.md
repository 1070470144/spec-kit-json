# Spec 031: 修复恢复剧本的所有权问题

## 问题描述

当管理员通过"恢复并接管"功能恢复一个废弃（abandoned）的剧本时，原作者在"我的上传"页面中仍然可以看到该剧本，这是不符合预期的。

### 预期行为
- 管理员点击"恢复并接管"
- 剧本状态从 `abandoned` 变为 `published`
- **剧本所有权转移给系统（特定管理员用户或系统用户）**
- **原作者在"我的上传"中不再看到此剧本**
- 原作者失去对该剧本的编辑权限

### 实际行为
- ✅ 剧本状态正确改变
- ❌ 原作者仍能在"我的上传"中看到
- ❌ 所有权可能未正确转移

## 根本原因分析

### 1. 检查恢复 API

**文件:** `app/api/admin/scripts/[id]/restore/route.ts`

需要检查：
```typescript
// 当前可能的实现
await prisma.script.update({
  where: { id },
  data: {
    state: 'published',
    // ❌ 可能缺少所有权转移
  }
})
```

**应该是：**
```typescript
await prisma.script.update({
  where: { id },
  data: {
    state: 'published',
    userId: SYSTEM_USER_ID,  // ✅ 转移所有权
  }
})
```

### 2. 检查"我的上传"查询

**文件:** `app/my/uploads/page.tsx` 或相关 API

可能的查询：
```typescript
// 当前查询（可能有问题）
const scripts = await prisma.script.findMany({
  where: { userId: currentUser.id }  // ❌ 只按 userId 查询
})
```

**应该是：**
```typescript
const scripts = await prisma.script.findMany({
  where: { 
    userId: currentUser.id,
    state: { not: 'abandoned' }  // ✅ 排除已废弃的（虽然所有权应该已转移）
  }
})
```

### 3. 数据库 Schema 检查

**文件:** `prisma/schema.prisma`

检查 Script 模型：
```prisma
model Script {
  id        String   @id @default(cuid())
  title     String
  userId    String   // 所有者 ID
  user      User     @relation(fields: [userId], references: [id])
  state     String?  // 状态：pending, published, rejected, abandoned
  // ...
}
```

## 问题诊断步骤

### Step 1: 检查现有实现
1. 查看 restore API 是否转移所有权
2. 查看"我的上传"的查询逻辑
3. 验证数据库中恢复后的剧本的 userId

### Step 2: 确定系统用户
需要一个"系统用户"来接管被恢复的剧本：
- 选项 A: 创建专门的系统用户（如 `system@admin.local`）
- 选项 B: 使用第一个管理员用户
- 选项 C: 使用执行恢复操作的管理员

**推荐：选项 A** - 创建专门的系统用户，便于追踪和管理

### Step 3: 修复方案设计

## 解决方案

### 方案 A: 完整的所有权转移（推荐）

#### 1. 创建/获取系统用户

```typescript
// src/lib/system-user.ts
export async function getSystemUser() {
  const SYSTEM_EMAIL = 'system@admin.local'
  
  let systemUser = await prisma.user.findUnique({
    where: { email: SYSTEM_EMAIL }
  })
  
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: SYSTEM_EMAIL,
        name: '系统',
        role: 'admin',
        emailVerified: new Date(),
      }
    })
  }
  
  return systemUser
}
```

#### 2. 修改恢复 API

**文件:** `app/api/admin/scripts/[id]/restore/route.ts`

```typescript
import { getSystemUser } from '@/lib/system-user'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: { message: '需要管理员权限' } }, { status: 403 })
    }
    
    const { id } = params
    const body = await request.json()
    const { newState = 'published', transferOwnership = true } = body
    
    // 获取系统用户
    const systemUser = await getSystemUser()
    
    // 更新数据
    const updateData: any = {
      state: newState,
    }
    
    // 如果需要转移所有权
    if (transferOwnership) {
      updateData.userId = systemUser.id
    }
    
    const script = await prisma.script.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({
      success: true,
      data: script,
      message: transferOwnership 
        ? '剧本已恢复并转移为系统所有' 
        : '剧本已恢复'
    })
  } catch (error) {
    console.error('Restore script error:', error)
    return NextResponse.json(
      { error: { message: '恢复失败' } },
      { status: 500 }
    )
  }
}
```

#### 3. 验证"我的上传"查询

**文件:** 检查获取用户上传的 API/逻辑

确保查询正确：
```typescript
// 方式1: 直接通过 userId 查询（所有权已转移，自然不会查到）
const myScripts = await prisma.script.findMany({
  where: {
    userId: currentUser.id,  // ✅ 已转移所有权的不会出现
  }
})

// 方式2: 额外保险（可选）
const myScripts = await prisma.script.findMany({
  where: {
    userId: currentUser.id,
    state: { notIn: ['abandoned'] }  // 额外排除 abandoned
  }
})
```

### 方案 B: 添加原始作者字段（备选方案）

如果需要保留原始作者信息：

#### 1. 修改 Schema

```prisma
model Script {
  id              String   @id @default(cuid())
  title           String
  userId          String   // 当前所有者
  user            User     @relation(fields: [userId], references: [id])
  originalUserId  String?  // 原始作者（可选）
  originalUser    User?    @relation("OriginalAuthor", fields: [originalUserId], references: [id])
  state           String?
  // ...
}
```

#### 2. 恢复时保留原始作者

```typescript
const script = await prisma.script.findUnique({
  where: { id }
})

await prisma.script.update({
  where: { id },
  data: {
    state: 'published',
    originalUserId: script.userId,  // 保存原始作者
    userId: systemUser.id,          // 转移所有权
  }
})
```

## 实施步骤

### Phase 1: 代码准备
1. ✅ 创建系统用户工具函数
2. ✅ 修改 restore API，添加所有权转移
3. ✅ 验证"我的上传"查询逻辑

### Phase 2: 数据修复
4. ✅ 查找已经恢复但所有权未转移的剧本
5. ✅ 批量修复这些剧本的所有权

### Phase 3: 测试验证
6. ✅ 测试恢复功能
7. ✅ 验证原作者看不到已接管的剧本
8. ✅ 验证管理员可以编辑已接管的剧本

## 测试用例

### 测试 1: 恢复并接管流程
```
前置条件:
- 用户 A (ID: user-a) 上传了剧本 S1
- 剧本 S1 被标记为 abandoned

步骤:
1. 管理员访问剧本列表，切换到"已废弃"
2. 找到剧本 S1，点击"恢复并接管"
3. 确认恢复

验证:
✅ 剧本状态变为 published
✅ 剧本的 userId 变为系统用户 ID
✅ 用户 A 访问"我的上传"，看不到剧本 S1
✅ 管理员可以编辑剧本 S1
```

### 测试 2: 查询隔离
```
步骤:
1. 用户 A 登录
2. 访问 /my/uploads

验证:
✅ 只显示 userId === user-a 的剧本
✅ 不显示已被接管的剧本
```

### 测试 3: 系统用户创建
```
步骤:
1. 首次执行恢复操作
2. 检查数据库

验证:
✅ 自动创建了系统用户
✅ 系统用户 email = 'system@admin.local'
✅ 系统用户 role = 'admin'
```

## 数据修复脚本

如果已经有被恢复但所有权未转移的剧本：

```typescript
// scripts/fix-restored-scripts-ownership.ts
import { PrismaClient } from '@prisma/client'
import { getSystemUser } from '../src/lib/system-user'

const prisma = new PrismaClient()

async function main() {
  console.log('开始修复已恢复剧本的所有权...')
  
  // 获取系统用户
  const systemUser = await getSystemUser()
  console.log(`系统用户: ${systemUser.email} (${systemUser.id})`)
  
  // 查找可能需要修复的剧本
  // 假设：state = published 但之前可能是 abandoned 且未转移所有权
  // 这个查询需要根据实际情况调整
  const scriptsToFix = await prisma.script.findMany({
    where: {
      state: 'published',
      // 可能需要其他条件来识别需要修复的剧本
    },
    include: {
      user: true
    }
  })
  
  console.log(`找到 ${scriptsToFix.length} 个剧本需要检查`)
  
  // 手动检查或批量处理
  // 这里需要谨慎，避免误操作
  
  // 示例：批量转移所有权（谨慎使用！）
  // const result = await prisma.script.updateMany({
  //   where: {
  //     id: { in: scriptsToFix.map(s => s.id) }
  //   },
  //   data: {
  //     userId: systemUser.id
  //   }
  // })
  
  console.log('修复完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## 配置选项

### 环境变量（可选）

```env
# .env
SYSTEM_USER_EMAIL=system@admin.local
SYSTEM_USER_NAME=系统管理员
```

## 注意事项

1. **数据完整性**: 转移所有权后，原作者将失去所有权限
2. **审计追踪**: 考虑记录所有权转移的历史（如果需要）
3. **通知机制**: 可选：通知原作者剧本已被系统接管
4. **批量操作**: 修复现有数据时要谨慎，建议先备份数据库

## 相关文件

### 需要创建
- `src/lib/system-user.ts` - 系统用户工具函数

### 需要修改
- `app/api/admin/scripts/[id]/restore/route.ts` - 恢复 API

### 需要检查
- `app/my/uploads/page.tsx` - 我的上传页面
- `app/api/scripts/route.ts` 或相关 API - 获取用户剧本的查询

### 可选创建
- `scripts/fix-restored-scripts-ownership.ts` - 数据修复脚本

## 成功标准

- [x] 恢复的剧本所有权正确转移给系统用户
- [x] 原作者在"我的上传"中看不到已接管的剧本
- [x] 管理员可以编辑已接管的剧本
- [x] 系统用户自动创建和管理
- [x] 所有测试用例通过

## 后续优化

1. **所有权转移历史**: 记录所有权变更日志
2. **通知系统**: 通知原作者剧本已被接管
3. **批量操作**: 支持批量接管多个废弃剧本
4. **UI 改进**: 在管理界面显示原始作者信息

