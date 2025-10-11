# 021: 修复自动生成预览图路径问题

## 📋 规格概览

修复自动生成预览图保存时的路径错误，导致收藏页面和列表页面图片无法正常显示的 bug。

**状态**: ✅ Fixed (Pending User Testing)  
**优先级**: High  
**类型**: Bug Fix  
**实际工作量**: ~30 分钟

## 🎯 问题描述

用户通过自动生成预览图上传剧本后，在"我的收藏"页面中图片无法正常显示。

### 问题现象
```
1. 用户上传 JSON（不上传图片）
2. 系统自动生成预览图
3. 上传成功 ✅
4. 收藏该剧本
5. 在收藏页面查看 ❌ 图片不显示
```

## 🔍 根本原因

代码中保存了**绝对路径**而不是**相对路径**：

```typescript
// ❌ 错误代码 (第 286 行)
path: fullPath  // "/app/uploads/previews/script-123.svg"

// ✅ 应该是
path: imagePath  // "previews/script-123.svg"
```

## 📁 文档结构

```
021-fix-auto-preview-image-path/
├── README.md          # 本文档（概览）
└── spec.md            # 详细规格和解决方案
```

## 🛠️ 解决方案

### 代码修改
**文件**: `app/api/scripts/route.ts`  
**行数**: 第 286 行  
**修改**: 1 个字符（`fullPath` → `imagePath`）

### 数据修复
创建迁移脚本修复已存在的错误数据：
```bash
node scripts/fix-preview-paths.mjs
```

## ✅ 验收标准

- [x] 上传无图片的剧本，自动生成预览图
- [x] 数据库中 path 字段为相对路径
- [x] 运行数据迁移脚本（无需修复数据）
- [ ] 列表页面显示预览图正常（待用户测试）
- [ ] 收藏页面显示预览图正常（待用户测试）
- [x] 现有用户上传图片的剧本不受影响

## 🚀 快速实施

```bash
# 1. 修改代码
# 编辑 app/api/scripts/route.ts 第 286 行
# 将 path: fullPath 改为 path: imagePath

# 2. 创建数据迁移脚本
# scripts/fix-preview-paths.mjs

# 3. 运行迁移
node scripts/fix-preview-paths.mjs

# 4. 测试
npm run dev
# 上传测试剧本，验证图片显示

# 5. 提交
git add .
git commit -m "fix: 修复自动生成预览图路径保存错误"
```

## 📊 影响范围

### 受影响的功能
- ✅ 剧本列表页面
- ✅ 剧本详情页面
- ✅ 我的收藏页面
- ✅ 我的上传页面

### 受影响的用户
- 使用自动生成预览图功能的用户
- 收藏了自动生成预览图剧本的用户

### 不受影响
- 上传了自定义图片的剧本
- 其他功能模块

## 🐛 Bug 严重程度

**严重程度**: 高  
**影响用户**: 所有使用自动生成预览图的用户  
**修复难度**: 低（1 行代码）  
**修复优先级**: 高

## 📝 相关文件

- `app/api/scripts/route.ts` - 主要修改
- `src/generators/script-preview.ts` - 预览图生成
- `app/scripts/ScriptImagesCarousel.tsx` - 图片显示
- `app/my/favorites/page.tsx` - 收藏页面

---

**下一步**: 查看 [spec.md](./spec.md) 了解详细的解决方案和数据迁移步骤。

