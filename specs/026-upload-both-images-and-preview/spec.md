# Spec 026: 修复同时上传图片和预览图问题

## 概述
**规格编号**: 026  
**创建日期**: 2025-10-11  
**状态**: 实施中  

## 目标
修复上传页面的 bug，使用户可以同时保存自己上传的图片和自动生成的预览图，而不是二选一。

## 背景
用户反馈：在上传界面同时上传了自己的图片和生成了自动预览图，但提交后在"我的上传"中只看到了用户上传的图片，自动生成的预览图丢失了。

## 问题分析

### 根本原因
在 `app/upload/page.tsx` 的第 94-104 行：

```typescript
// 添加用户上传的图片
for (const f of images) form.append('images', f)

// 如果有自动生成的预览图且没有用户上传图片，则上传预览图
if (autoPreviewUrl && images.length === 0) {
  try {
    const response = await fetch(autoPreviewUrl)
    const blob = await response.blob()
    const previewFile = new File([blob], `preview-${Date.now()}.svg`, { type: 'image/svg+xml' })
    form.append('images', previewFile)
  } catch (error) {
    console.error('Failed to convert preview to file:', error)
  }
}
```

**问题**：
- ❌ 条件 `images.length === 0` 限制了只有在没有用户图片时才上传预览图
- ❌ 如果用户同时有自己的图片和预览图，预览图会被忽略
- ❌ 这是一个"二选一"逻辑，而不是"都保存"

### 期望行为
用户希望：
- ✅ 如果只上传了图片 → 保存用户图片
- ✅ 如果只生成了预览图 → 保存预览图
- ✅ **如果两者都有 → 同时保存用户图片和预览图**

### 数据库约束检查
需要检查是否有图片数量限制：
- 查看 `app/api/scripts/route.ts` 中的图片处理逻辑
- 确认数据库是否支持多张图片

## 解决方案

### 方案 1：总是上传预览图（推荐）
如果有自动预览图，总是将其作为额外的图片上传，不管用户是否上传了自己的图片。

```typescript
// 添加用户上传的图片
for (const f of images) form.append('images', f)

// 如果有自动生成的预览图，也上传它
if (autoPreviewUrl) {
  try {
    const response = await fetch(autoPreviewUrl)
    const blob = await response.blob()
    const previewFile = new File([blob], `preview-${Date.now()}.svg`, { type: 'image/svg+xml' })
    form.append('images', previewFile)
  } catch (error) {
    console.error('Failed to convert preview to file:', error)
  }
}
```

**优点**：
- ✅ 简单直接
- ✅ 保留所有图片
- ✅ 用户可以选择使用哪张图片作为封面

**缺点**：
- ⚠️ 可能超过 3 张图片的限制（需要调整限制或优先级）

### 方案 2：调整图片数量限制
将最大图片数量从 3 张调整为 4 张，为自动预览图预留位置。

```typescript
// 在提交前检查
if (images.length > 3) { 
  showToast('最多选择 3 张图片', 'error'); 
  return 
}

// 修改为
const maxUserImages = autoPreviewUrl ? 3 : 3 // 如果有预览图，用户最多 3 张，总共 4 张
if (images.length > maxUserImages) { 
  showToast(`最多选择 ${maxUserImages} 张图片`, 'error'); 
  return 
}
```

### 方案 3：优先级策略
设置图片的优先级，让数据库知道哪些是用户图片，哪些是自动预览图。

在后端 API 中：
- 用户上传的图片 `sortOrder` 设为 0, 1, 2
- 自动预览图 `sortOrder` 设为 -1（最低优先级）

这样在显示时优先展示用户图片，但也保留预览图。

## 推荐实现方案

结合方案 1 和方案 3：
1. **前端**：总是上传自动预览图（如果存在）
2. **后端**：自动预览图设置为最低优先级（`sortOrder = -1`）
3. **显示**：优先展示用户图片，预览图作为备选

### 修改内容

#### app/upload/page.tsx
```typescript
// 修改前
if (autoPreviewUrl && images.length === 0) {

// 修改后
if (autoPreviewUrl) {
```

#### app/api/scripts/route.ts
确保自动预览图的 `sortOrder` 设为 -1（已经是这样）。

## 实现步骤

### Phase 1: 修改上传逻辑
- [x] 移除 `images.length === 0` 条件
- [x] 总是上传自动预览图（如果存在）

### Phase 2: 验证后端逻辑
- [ ] 检查后端是否正确处理多张图片
- [ ] 确认自动预览图的 `sortOrder` 为 -1
- [ ] 确认图片数量限制

### Phase 3: 测试
- [ ] 测试只上传用户图片
- [ ] 测试只生成预览图
- [ ] 测试同时上传用户图片和预览图
- [ ] 测试图片显示顺序

## 验收标准

### 功能验收
1. ✅ 只上传用户图片 → 显示用户图片
2. ✅ 只生成预览图 → 显示预览图
3. ✅ 同时有用户图片和预览图 → 同时保存并显示
4. ✅ 用户图片优先展示

### 数据验收
1. ✅ 数据库中保存了所有图片
2. ✅ 用户图片 `sortOrder` 为 0, 1, 2
3. ✅ 预览图 `sortOrder` 为 -1

### 显示验收
1. ✅ "我的上传"页面显示用户图片（优先）
2. ✅ 剧本详情页显示所有图片
3. ✅ 图片轮播正常工作

## 风险与限制

### 已知限制
1. **图片数量**: 用户最多上传 3 张图片 + 1 张自动预览图 = 总共 4 张
2. **存储空间**: 每个剧本的图片数量增加

### 风险缓解
1. 自动预览图优先级最低，不影响用户图片展示
2. 如果需要控制存储，可以在后台清理未使用的预览图

## 相关资源
- 上传页面: `app/upload/page.tsx`
- API 路由: `app/api/scripts/route.ts`
- 数据模型: Prisma Schema - `ImageAsset`

## 变更历史
- 2025-10-11: 初始创建

