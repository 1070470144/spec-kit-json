# Spec: 修复实时生成预览图的路径保存问题

**ID**: 022-fix-auto-preview-realtime-gen-path  
**Created**: 2025-10-10  
**Status**: ✅ Fixed (Pending User Testing)  
**Priority**: High  
**Type**: Bug Fix  
**Related**: [021-fix-auto-preview-image-path](../021-fix-auto-preview-image-path/)

## 问题描述

在"我的上传"页面，自动生成的预览图依然不显示。经过进一步排查，发现了第二个路径保存错误。

### 问题定位

在 `app/api/scripts/[id]/auto-preview/route.ts` 中，**实时生成预览图**后保存到数据库时，第 99 行也使用了绝对路径而不是相对路径。

## 根本原因

### 问题代码位置
文件：`xueran-juben-project/app/api/scripts/[id]/auto-preview/route.ts`  
行数：第 99 行

### 错误代码
```typescript
// 第 85-106 行
setImmediate(async () => {
  try {
    // 检查是否已存在记录
    const existing = await prisma.imageAsset.findFirst({
      where: {
        scriptId: id,
        path: fullPath  // ❌ 查询时使用绝对路径
      }
    })
    
    if (!existing) {
      await prisma.imageAsset.create({
        data: {
          scriptId: id,
          path: fullPath,  // ❌ 错误：保存绝对路径
          mime: 'image/svg+xml',
          size: 0,
          sha256: '',
          isCover: true,
          sortOrder: -1,
        }
      })
    }
  } catch (error) {
    console.warn(`[AUTO PREVIEW] Database update failed for ${id}:`, error)
  }
})
```

### 问题分析

1. **保存错误**：第 99 行使用 `fullPath`（绝对路径）保存
2. **查询错误**：第 91 行也使用 `fullPath` 查询，导致每次都认为不存在
3. **重复创建**：每次访问都会创建新记录（因为查询不到）
4. **路径错误**：保存的绝对路径无法被 `/api/files` API 正确处理

## 影响范围

### 受影响场景
1. **访问详情页**：首次访问时实时生成预览图
2. **访问列表页**：触发后台预览图生成
3. **我的上传页面**：使用 ScriptImagesCarousel 显示预览图

### 问题表现
- 预览图能实时生成和显示（通过 `/api/scripts/${id}/auto-preview`）
- 但数据库中保存的是错误的绝对路径
- 导致从数据库读取图片列表时，路径错误，图片无法显示

## 解决方案

### 修改方案

**文件**: `xueran-juben-project/app/api/scripts/[id]/auto-preview/route.ts`

#### 修改 1：查询时使用相对路径（第 91 行）
```typescript
// ❌ 修改前
const existing = await prisma.imageAsset.findFirst({
  where: {
    scriptId: id,
    path: fullPath  // 绝对路径
  }
})

// ✅ 修改后
const existing = await prisma.imageAsset.findFirst({
  where: {
    scriptId: id,
    path: imagePath  // 相对路径
  }
})
```

#### 修改 2：保存时使用相对路径（第 99 行）
```typescript
// ❌ 修改前
await prisma.imageAsset.create({
  data: {
    scriptId: id,
    path: fullPath,  // 绝对路径
    ...
  }
})

// ✅ 修改后
await prisma.imageAsset.create({
  data: {
    scriptId: id,
    path: imagePath,  // 相对路径
    ...
  }
})
```

## 关联问题

### 与 021 的关系
- **021**: 修复上传时自动生成预览图的路径问题（POST `/api/scripts`）
- **022**: 修复实时生成预览图的路径问题（GET `/api/scripts/[id]/auto-preview`）

两个问题本质相同，都是保存了绝对路径而不是相对路径。

### 为什么之前没发现？

021 的修复解决了**上传时**的问题，但：
1. 如果剧本在上传时没有自动生成预览图保存到数据库
2. 用户访问该剧本时，会触发**实时生成**
3. 实时生成的代码也有同样的路径错误
4. 导致保存的依然是绝对路径

## 验收标准

- [x] 查询时使用相对路径
- [x] 保存时使用相对路径
- [ ] 上传无图片剧本，访问"我的上传"，预览图正常显示（待用户测试）
- [ ] 访问剧本详情页，预览图正常显示（待用户测试）
- [ ] 检查数据库，path 字段为相对路径（待用户测试）
- [x] 运行数据迁移脚本（使用 021 的脚本）

## 数据修复

使用与 021 相同的迁移脚本：
```bash
node scripts/fix-preview-paths.mjs
```

该脚本会修复所有错误的绝对路径，包括：
- 上传时保存的错误路径
- 实时生成保存的错误路径

## 预估工作量

- **代码修改**: 5 分钟（2 行代码）
- **测试验证**: 15 分钟
- **数据迁移**: 2 分钟
- **总计**: ~20 分钟

## 测试计划

### 1. 功能测试
```bash
# 1. 上传无图片剧本
访问 /upload，上传 JSON（不上传图片）

# 2. 访问"我的上传"
访问 /my/uploads
预期：预览图正常显示

# 3. 访问详情页
访问 /scripts/{id}
预期：预览图正常显示
```

### 2. 数据库验证
```sql
-- 查看自动生成的预览图路径
SELECT id, scriptId, path, mime 
FROM ImageAsset 
WHERE mime = 'image/svg+xml'
ORDER BY createdAt DESC 
LIMIT 10;

-- 应该都是相对路径，如：previews/script-xxx.svg
-- 不应该包含 /app/uploads/ 等前缀
```

## 相关文件

- `app/api/scripts/[id]/auto-preview/route.ts` - 主要修改文件
- `app/api/scripts/route.ts` - 已在 021 中修复
- `scripts/fix-preview-paths.mjs` - 数据迁移脚本（复用）

## 总结

这是 021 问题的**补充修复**：
- **021**: 修复了上传时的路径问题
- **022**: 修复了实时生成时的路径问题

两处都需要修复才能彻底解决预览图显示问题。

