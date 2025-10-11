# 031: 修复恢复剧本的所有权显示问题

## 状态
✅ **已完成**

## 问题
管理员通过"恢复并接管"功能恢复废弃剧本后，原作者在"我的上传"中仍然可以看到该剧本。

## 根本原因

### 当前实现机制
- 使用 `systemOwned` 字段标记系统接管的剧本
- 使用 `originalOwnerId` 保存原始所有者
- `createdById` 字段保持不变

### 查询问题
**文件:** `app/my/uploads/page.tsx` (第 27-28 行)

```typescript
where: { 
  createdById: session.userId,
  state: { not: 'abandoned' }  // ❌ 只排除 abandoned
}
```

**问题：**
1. 恢复后 `state` 变为 `published`（不再是 abandoned）
2. `systemOwned` 变为 `true`
3. `createdById` 仍然是原作者 ID
4. 查询条件没有检查 `systemOwned` 字段
5. **结果：剧本仍然显示在原作者的列表中** ❌

## 解决方案

### 修复内容
添加 `systemOwned: false` 到查询条件：

```typescript
where: { 
  createdById: session.userId,
  state: { not: 'abandoned' },
  systemOwned: false  // ✅ 排除系统接管的剧本
}
```

### 改动文件
- ✅ `app/my/uploads/page.tsx` - 修复查询条件（两处）

## 验证步骤

### 测试场景
1. 用户 A 上传剧本 S1
2. 剧本 S1 被标记为 `abandoned`
3. 管理员恢复并接管剧本 S1
4. 用户 A 访问"我的上传"页面

### 预期结果
- ✅ 剧本 S1 不再出现在用户 A 的列表中
- ✅ 剧本 S1 的 `systemOwned` 为 `true`
- ✅ 只显示用户 A 真正拥有的剧本

## 技术细节

### Schema 字段说明
```prisma
model Script {
  systemOwned     Boolean   @default(false)  // 系统接管标记
  originalOwnerId String?                    // 原始所有者ID
  transferredAt   DateTime?                  // 转移时间
  createdById     String?                    // 创建者（不变）
  authorId        String?                    // 作者（不变）
}
```

### 恢复 API 逻辑
```typescript
// app/api/admin/scripts/[id]/restore/route.ts
if (transferOwnership) {
  updateData.systemOwned = true
  updateData.originalOwnerId = script.createdById
  updateData.transferredAt = new Date()
}
```

## 相关文档
- [spec.md](./spec.md) - 详细技术分析和方案设计

