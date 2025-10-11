# 023: 修复 /api/files 路径解析问题

## 📋 规格概览

修复 `/api/files` API，使其能同时处理相对路径和绝对路径，解决预览图无法显示的最后一个障碍。

**状态**: ✅ Fixed (Pending Migration)  
**优先级**: Critical 🔥  
**类型**: Bug Fix  
**实际工作量**: ~45 分钟

## 🎯 问题描述

修复了 021 和 022 后，预览图仍然返回 404：
```
GET /api/files?path=generated-previews%2F...svg 404
```

### 根本原因

数据库中路径格式不一致：
- 用户上传图片：存**绝对路径** → `/api/files` 能工作 ✅
- 自动生成预览图：存**相对路径** → `/api/files` 无法工作 ❌

## 📁 文档结构

```
023-fix-api-files-path-resolution/
├── README.md          # 本文档（概览）
└── spec.md            # 详细规格
```

## 🐛 三个Bug的完整链条

| #  | 问题 | 位置 | 状态 |
|----|------|------|------|
| 021 | 上传时保存绝对路径 | `POST /api/scripts` | ✅ 已修复 |
| 022 | 实时生成保存绝对路径 | `GET /api/scripts/[id]/auto-preview` | ✅ 已修复 |
| 023 | API 无法处理相对路径 | `GET /api/files` | 🔄 待修复 |

## 🛠️ 解决方案

### 修改 `/api/files` API

**文件**: `app/api/files/route.ts`

支持两种路径格式：
```typescript
const fullPath = isAbsolute(path) 
  ? path  // 绝对路径：直接使用
  : join(uploadDir, path)  // 相对路径：拼接 uploadDir
```

### 数据迁移

将所有绝对路径转换为相对路径：
```bash
node scripts/migrate-image-paths.mjs
```

## ✅ 验收标准

- [x] API 支持相对路径
- [x] API 支持绝对路径（向后兼容）
- [x] 安全：防止路径遍历攻击
- [ ] 用户上传图片正常显示（待用户测试）
- [ ] 自动生成预览图正常显示（待用户测试）
- [ ] 运行数据迁移脚本（待用户执行）

## 🚀 快速实施

```bash
# 1. 修改 API
# 编辑 app/api/files/route.ts
# 添加路径解析逻辑

# 2. 创建并运行迁移脚本
node scripts/migrate-image-paths.mjs

# 3. 测试
npm run dev
# 访问剧本页面，验证图片显示
```

## 📊 修复后的效果

所有图片都能正常显示：
- ✅ 用户上传的图片（旧数据：绝对路径 → 迁移后：相对路径）
- ✅ 自动生成的预览图（新数据：相对路径）
- ✅ 所有页面的图片加载

## 🔒 安全措施

1. **路径遍历防护**：防止访问 uploads 目录外的文件
2. **文件存在性检查**：返回 404 而不是暴露错误信息
3. **路径规范化**：统一使用相对路径

## 📝 相关文件

- `app/api/files/route.ts` - 主要修改
- `scripts/migrate-image-paths.mjs` - 数据迁移脚本
- `src/storage/local.ts` - 存储实现

---

**下一步**: 查看 [spec.md](./spec.md) 了解详细的解决方案。

