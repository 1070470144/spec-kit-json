# 022: 修复实时生成预览图的路径保存问题

## 📋 规格概览

修复实时生成预览图时的路径保存错误，这是 021 问题的补充修复。

**状态**: ✅ Fixed (Pending User Testing)  
**优先级**: High  
**类型**: Bug Fix  
**实际工作量**: ~15 分钟  
**关联**: [021-fix-auto-preview-image-path](../021-fix-auto-preview-image-path/)

## 🎯 问题描述

在"我的上传"页面，自动生成的预览图依然不显示。

### 根本原因

发现了第二个路径错误位置：**实时生成预览图**时也保存了绝对路径。

## 📁 文档结构

```
022-fix-auto-preview-realtime-gen-path/
├── README.md          # 本文档（概览）
└── spec.md            # 详细规格
```

## 🐛 两个Bug的关系

| Bug | 位置 | 触发时机 | 状态 |
|-----|------|---------|------|
| 021 | `POST /api/scripts` | 上传时自动生成 | ✅ 已修复 |
| 022 | `GET /api/scripts/[id]/auto-preview` | 实时生成 | 🔄 待修复 |

## 🛠️ 解决方案

### 代码修改
**文件**: `app/api/scripts/[id]/auto-preview/route.ts`

#### 修改 1: 第 91 行
```typescript
// ❌ 错误
path: fullPath

// ✅ 修复
path: imagePath
```

#### 修改 2: 第 99 行
```typescript
// ❌ 错误
path: fullPath,

// ✅ 修复
path: imagePath,
```

## ✅ 验收标准

- [x] 查询时使用相对路径
- [x] 保存时使用相对路径
- [ ] "我的上传"页面预览图正常显示（待用户测试）
- [ ] 详情页面预览图正常显示（待用户测试）
- [ ] 数据库中 path 为相对路径（待用户测试）

## 🚀 快速实施

```bash
# 1. 修改代码
# 编辑 app/api/scripts/[id]/auto-preview/route.ts
# 第 91 行: fullPath → imagePath
# 第 99 行: fullPath → imagePath

# 2. 运行数据迁移（使用 021 的脚本）
node scripts/fix-preview-paths.mjs

# 3. 测试
npm run dev
# 上传无图片剧本，访问"我的上传"页面
```

## 📊 影响范围

### 修复后的效果
- ✅ 上传时保存正确路径（021 已修复）
- ✅ 实时生成时保存正确路径（022 待修复）
- ✅ 所有页面预览图正常显示

### 受影响的页面
- 我的上传页面
- 剧本详情页面
- 剧本列表页面
- 我的收藏页面

## 📝 相关文件

- `app/api/scripts/[id]/auto-preview/route.ts` - 主要修改
- `app/api/scripts/route.ts` - 021 已修复
- `scripts/fix-preview-paths.mjs` - 数据迁移脚本（复用）

---

**下一步**: 查看 [spec.md](./spec.md) 了解详细的解决方案。

