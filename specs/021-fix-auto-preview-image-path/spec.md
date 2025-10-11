# Spec: 修复自动生成预览图路径问题

**ID**: 021-fix-auto-preview-image-path  
**Created**: 2025-10-10  
**Status**: ✅ Fixed (Pending User Testing)  
**Priority**: High  
**Type**: Bug Fix

## 问题描述

通过自动生成预览图上传剧本后，在"我的收藏"页面和其他地方，图片无法正常显示。

### 问题表现
- 用户上传 JSON 文件，不上传图片
- 系统自动生成预览图
- 上传成功
- 在收藏页面或列表页面，预览图显示失败或显示占位符

### 用户反馈
> "我通过自动生成预览图上传后，我的收藏中图片没有正常显示出来"

## 根本原因分析

### 问题定位

在 `app/api/scripts/route.ts` 的 POST 方法中（第 261-300 行），自动生成预览图的逻辑存在路径保存错误：

```typescript
// 第 276-277 行
const imagePath = getPreviewImagePath(scriptId)  // 相对路径，如 "previews/script-123.svg"
const fullPath = storage.getAbsolutePath(imagePath)  // 绝对路径，如 "/app/uploads/previews/script-123.svg"

// 第 282-292 行 - 保存到数据库
await prisma.imageAsset.create({
  data: {
    scriptId: scriptId,
    path: fullPath,  // ❌ 错误：保存了绝对路径
    mime: 'image/svg+xml',
    size: 0,
    sha256: '',
    isCover: true,
    sortOrder: -1,
  }
})
```

### 问题根源

**错误**：保存到数据库的 `path` 字段使用了 `fullPath`（绝对路径），而不是 `imagePath`（相对路径）。

**正确做法**：应该保存相对路径 `imagePath`，因为：
1. `/api/files?path=xxx` API 期望接收相对路径
2. 其他用户上传的图片保存的都是相对路径
3. 绝对路径在不同环境（开发/生产）会不同

### 影响范围

- ✅ 用户上传图片的剧本：正常显示（因为保存的是相对路径）
- ❌ 自动生成预览图的剧本：显示失败（因为保存的是绝对路径）

## 解决方案

### 修改位置
文件：`xueran-juben-project/app/api/scripts/route.ts`  
行数：第 286 行

### 修改前
```typescript
await prisma.imageAsset.create({
  data: {
    scriptId: scriptId,
    path: fullPath,  // ❌ 错误：绝对路径
    mime: 'image/svg+xml',
    size: 0,
    sha256: '',
    isCover: true,
    sortOrder: -1,
  }
})
```

### 修改后
```typescript
await prisma.imageAsset.create({
  data: {
    scriptId: scriptId,
    path: imagePath,  // ✅ 正确：相对路径
    mime: 'image/svg+xml',
    size: 0,
    sha256: '',
    isCover: true,
    sortOrder: -1,
  }
})
```

## 验收标准

### 功能测试
- [ ] 上传只有 JSON 的剧本（不上传图片）
- [ ] 系统自动生成预览图
- [ ] 在剧本列表页面能看到预览图
- [ ] 点击收藏该剧本
- [ ] 在"我的收藏"页面能正常显示预览图
- [ ] 预览图能正常加载，不显示占位符

### 数据验证
- [ ] 检查数据库 `ImageAsset` 表中自动生成的图片
- [ ] `path` 字段应该是相对路径（如 `previews/script-xxx.svg`）
- [ ] 不应该包含绝对路径前缀（如 `/app/uploads/...`）

### 兼容性
- [ ] 不影响用户上传图片的功能
- [ ] 不影响现有已发布的剧本显示

## 数据修复

### 修复现有数据

对于已经保存了错误路径的数据，需要执行数据迁移：

```sql
-- 查询受影响的记录
SELECT id, scriptId, path 
FROM ImageAsset 
WHERE mime = 'image/svg+xml' 
  AND path LIKE '/%';

-- 修复路径（将绝对路径转为相对路径）
-- 示例：将 '/app/uploads/previews/script-123.svg' 改为 'previews/script-123.svg'
UPDATE ImageAsset 
SET path = REGEXP_REPLACE(path, '^.*/uploads/', '')
WHERE mime = 'image/svg+xml' 
  AND path LIKE '/%';
```

### 迁移脚本

创建迁移脚本 `scripts/fix-preview-paths.mjs`：

```javascript
import { prisma } from '../src/db/client.ts'

async function fixPreviewPaths() {
  // 查找所有自动生成的预览图
  const assets = await prisma.imageAsset.findMany({
    where: {
      mime: 'image/svg+xml',
      path: {
        startsWith: '/'
      }
    }
  })

  console.log(`Found ${assets.length} assets with absolute paths`)

  for (const asset of assets) {
    // 提取相对路径
    const relativePath = asset.path.replace(/^.*\/uploads\//, '')
    
    console.log(`Fixing: ${asset.path} -> ${relativePath}`)
    
    await prisma.imageAsset.update({
      where: { id: asset.id },
      data: { path: relativePath }
    })
  }

  console.log('Migration completed')
}

fixPreviewPaths().catch(console.error).finally(() => process.exit())
```

运行迁移：
```bash
node scripts/fix-preview-paths.mjs
```

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 现有数据路径错误 | 高 | 确定 | 运行数据迁移脚本 |
| 路径格式不一致 | 中 | 低 | 统一使用相对路径 |
| 迁移脚本失败 | 中 | 低 | 备份数据库，测试脚本 |

## 测试计划

### 1. 单元测试
- 测试上传不带图片的剧本
- 验证数据库中保存的路径格式

### 2. 集成测试
- 完整上传流程测试
- 列表页面显示测试
- 收藏页面显示测试

### 3. 回归测试
- 用户上传图片的剧本显示正常
- 旧数据显示正常

## 预估工作量

- **代码修改**: 5 分钟（1 行代码）
- **数据迁移脚本**: 15 分钟
- **测试验证**: 20 分钟
- **总计**: ~40 分钟

## 相关文件

- `xueran-juben-project/app/api/scripts/route.ts` - 主要修改文件
- `xueran-juben-project/src/generators/script-preview.ts` - 预览图生成逻辑
- `xueran-juben-project/app/scripts/ScriptImagesCarousel.tsx` - 图片显示组件
- `xueran-juben-project/app/my/favorites/page.tsx` - 收藏页面

## 参考

- Issue: 用户反馈自动生成预览图在收藏中不显示
- Related: ImageAsset 数据模型定义
- Related: LocalStorage 路径处理逻辑

