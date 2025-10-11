# Spec 027: 修复删除剧本后缓存不更新问题

## 问题描述
用户删除已审核通过的剧本后，剧本的 `state` 在数据库中正确更新为 `'abandoned'`，但管理员端的"已废弃"列表看不到新删除的剧本，因为缓存没有被清除。

## 根本原因
删除操作（`/api/scripts/[id]/delete`）执行后，没有清除剧本列表的缓存，导致管理员端查询时仍然返回旧的缓存数据。

## 解决方案
在删除操作（软删除和硬删除）后，调用 `invalidateCache()` 清除所有剧本列表缓存。

## 修改的文件
- `app/api/scripts/[id]/delete/route.ts`
  - 导入 `invalidateCache`
  - 在软删除后清除缓存
  - 在硬删除后清除缓存

## 修改内容

### 修改前
```typescript
await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })
return ok({ softDeleted: true })
```

### 修改后
```typescript
await prisma.script.update({ where: { id }, data: { state: 'abandoned' } })

// 清除缓存（使用字符串模式匹配）
invalidateCache('scripts-')
console.log('[Delete] Cache invalidated for soft delete, script:', id)

return ok({ softDeleted: true })
```

## 预期行为
- ✅ 用户删除剧本后，管理员端"已废弃"列表立即显示
- ✅ "已通过"列表不再显示已删除的剧本
- ✅ 所有用户看到的剧本列表都是最新的

## 验收检查
- [x] 创建 spec 文档
- [ ] 添加缓存清除逻辑（软删除）
- [ ] 添加缓存清除逻辑（硬删除）
- [ ] 测试用户删除后管理员端列表更新
- [ ] 测试管理员删除后列表更新

## 相关文档
- [完整规格说明](./spec.md)

