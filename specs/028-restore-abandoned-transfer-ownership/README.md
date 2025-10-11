# Spec 028: 管理员恢复废弃剧本并转移所有权

## 问题描述
1. 用户删除剧本后，在"我的上传"页面仍然能看到（因为没有过滤 abandoned 状态）
2. 管理员无法修改已废弃剧本的状态（缺少恢复功能）
3. 没有所有权转移机制，恢复后剧本仍属于原用户

## 解决方案
1. **用户端**：修改查询过滤 `state = 'abandoned'` 的剧本
2. **管理员端**：添加"恢复"按钮和 API
3. **所有权转移**：添加 `systemOwned` 字段标记系统接管的剧本

## 技术实现

### 1. Schema 修改
```prisma
model Script {
  systemOwned     Boolean  @default(false)
  originalOwnerId String?
  transferredAt   DateTime?
}
```

### 2. API 路由
- `POST /api/admin/scripts/[id]/restore` - 恢复废弃剧本

### 3. 前端修改
- `app/my/uploads/page.tsx` - 过滤 abandoned
- `app/admin/_components/AdminScriptItem.tsx` - 添加恢复按钮
  - 使用 `mounted` 状态避免 Hydration 错误
  - 条件渲染不同按钮（abandoned: 恢复，非 abandoned: 编辑）

## 用户体验

### 普通用户
1. 删除剧本后，在"我的上传"中**立即消失**
2. 无法再编辑或删除被系统接管的剧本

### 管理员
1. 在"已废弃"列表看到所有用户删除的剧本
2. 可以点击"恢复并接管"按钮
3. 恢复后剧本重新上架，但不属于原用户

## 验收检查
- [ ] 修改 Prisma schema
- [ ] 运行数据库迁移
- [ ] 创建恢复 API
- [ ] 修改用户端查询
- [ ] 添加管理员端恢复按钮
- [ ] 测试完整流程

## 相关文档
- [完整规格说明](./spec.md)

