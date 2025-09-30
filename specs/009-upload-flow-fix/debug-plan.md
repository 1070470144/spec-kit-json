# 上传流程调试计划

**问题**: 上传后跳转到"我的上传"，但看不到刚上传的剧本

## 诊断步骤

### 1. 检查上传是否成功创建
- [ ] API 是否返回了剧本 ID
- [ ] 数据库是否真的创建了记录
- [ ] createdById 是否正确设置

### 2. 检查查询逻辑
- [ ] mine=1 参数是否传递
- [ ] cookie 是否正确传递
- [ ] session.userId 是否与 createdById 一致

### 3. 可能的原因
- [ ] Session cookie 名称不一致
- [ ] userId 不匹配
- [ ] 缓存问题（虽然用了 no-store）
- [ ] 数据库事务未提交

## 添加日志的位置

### 上传 API (`/api/scripts/route.ts`)
```typescript
// 第88行后添加
console.log('[Upload] Session:', session?.userId, 'Admin:', admin?.userId, 'OwnerId:', ownerId)

// 第108行后添加
console.log('[Upload] Created script:', scriptId, 'for user:', ownerId)
```

### 列表 API (`/api/scripts/route.ts` GET)
```typescript
// 第28-32行间添加
console.log('[List] Mine mode:', mine, 'Session userId:', s?.userId, 'Where:', where)

// 第44行后添加
console.log('[List] Found items:', items.length, 'Total:', total)
```

### 我的上传页面 (`/my/uploads/page.tsx`)
```typescript
// 第17行后添加
console.log('[MyUploads] Fetched:', items.length, 'items, Total:', total)
```
