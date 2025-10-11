# 实施笔记 - 021: 修复自动生成预览图路径问题

## 实施时间
2025-10-10

## 问题背景

用户反馈：通过自动生成预览图上传剧本后，在"我的收藏"页面中图片无法正常显示。

## 根本原因

在 `app/api/scripts/route.ts` 中，自动生成预览图保存到数据库时，使用了绝对路径而不是相对路径：

```typescript
// ❌ 错误代码 (第 286 行)
path: fullPath  // 保存的是 "/app/uploads/previews/script-123.svg"

// ✅ 应该是
path: imagePath  // 应该保存 "previews/script-123.svg"
```

### 为什么这是问题？

1. `/api/files?path=xxx` API 期望接收**相对路径**
2. 用户上传的图片保存的都是**相对路径**
3. 绝对路径在不同环境（开发/生产/Docker）会不同
4. 导致图片 URL 构建失败，无法加载图片

## 实施内容

### 1. 代码修复

**文件**: `xueran-juben-project/app/api/scripts/route.ts`  
**修改行数**: 第 285 行  
**修改内容**: 1 个单词（`fullPath` → `imagePath`）

#### 修改前
```typescript:285
path: fullPath,
```

#### 修改后
```typescript:285
path: imagePath,
```

### 2. 数据迁移脚本

创建了 `scripts/fix-preview-paths.mjs` 用于修复已存在的错误数据。

#### 脚本功能
- 查找所有以 `/` 开头的 SVG 图片路径（错误的绝对路径）
- 将绝对路径转换为相对路径
- 更新数据库记录
- 输出详细的修复日志

#### 运行方式
```bash
node scripts/fix-preview-paths.mjs
```

#### 脚本特点
- ✅ 安全：只修改自动生成的预览图（mime: image/svg+xml）
- ✅ 详细：输出每条记录的修复前后对比
- ✅ 统计：显示成功/失败数量
- ✅ 错误处理：单条失败不影响整体迁移

## 验证结果

### ✅ 代码质量
- TypeScript 编译通过
- ESLint 无错误
- 逻辑正确

### 🔄 待验证（需要实际环境）
- [ ] 运行迁移脚本修复现有数据
- [ ] 上传新的无图片剧本，验证自动生成预览图
- [ ] 在列表页面验证图片显示
- [ ] 在收藏页面验证图片显示
- [ ] 在详情页面验证图片显示

## 修复影响

### 受影响的场景
1. **剧本列表页面** - 显示预览图缩略图
2. **剧本详情页面** - 显示预览图轮播
3. **我的收藏页面** - 显示收藏的预览图
4. **我的上传页面** - 显示自己上传的预览图

### 受影响的用户
- 使用自动生成预览图功能上传剧本的用户
- 收藏了带自动预览图剧本的用户

### 不受影响
- 上传了自定义图片的剧本（使用的一直是相对路径）
- 其他功能模块

## 技术细节

### 路径对比

| 场景 | 错误路径（旧） | 正确路径（新） |
|------|---------------|--------------|
| 开发环境 | `/app/uploads/previews/script-123.svg` | `previews/script-123.svg` |
| 生产环境 | `/var/www/uploads/previews/script-123.svg` | `previews/script-123.svg` |
| Docker | `/usr/src/app/uploads/previews/script-123.svg` | `previews/script-123.svg` |

### 相对路径的优势
1. **环境无关**: 无论在哪个环境，路径都一致
2. **API 兼容**: `/api/files?path=previews/script-123.svg` 可以正常工作
3. **一致性**: 与用户上传图片的路径格式保持一致
4. **可移植性**: 数据库可以在不同环境间迁移

## 数据迁移计划

### 迁移前检查
```bash
# 连接数据库，查看受影响的记录数
# 查询以 / 开头的 SVG 路径
SELECT COUNT(*) FROM ImageAsset 
WHERE mime = 'image/svg+xml' 
  AND path LIKE '/%';
```

### 执行迁移
```bash
# 1. 备份数据库（可选但推荐）
# 根据具体数据库执行备份命令

# 2. 运行迁移脚本
cd xueran-juben-project
node scripts/fix-preview-paths.mjs

# 3. 验证结果
# 脚本会输出详细的修复日志
```

### 迁移后验证
```bash
# 查询是否还有以 / 开头的路径
SELECT * FROM ImageAsset 
WHERE mime = 'image/svg+xml' 
  AND path LIKE '/%';

# 应该返回 0 条记录
```

## 预防措施

### 如何避免类似问题？

1. **代码审查**: 保存路径时检查是相对路径还是绝对路径
2. **单元测试**: 为路径处理逻辑添加测试
3. **类型检查**: 使用类型系统标注路径类型（如 `RelativePath` vs `AbsolutePath`）
4. **命名规范**: 变量名明确表示路径类型（如 `relativePath`, `absolutePath`）

### 代码改进建议

```typescript
// 建议：在 Storage 类中添加路径验证
class LocalStorage {
  save(buffer: Buffer, filename: string, mime: string): { path: string } {
    const relativePath = this.generateRelativePath(filename)
    const absolutePath = this.getAbsolutePath(relativePath)
    
    // 保存文件...
    
    // 返回相对路径而不是绝对路径
    return {
      path: relativePath  // ✅ 确保返回相对路径
    }
  }
}
```

## 回滚计划

如果修复导致问题，可以执行以下回滚：

```sql
-- 备份修复后的数据
CREATE TABLE ImageAsset_backup AS SELECT * FROM ImageAsset;

-- 从备份恢复（如果有问题）
UPDATE ImageAsset SET path = ImageAsset_backup.path 
FROM ImageAsset_backup 
WHERE ImageAsset.id = ImageAsset_backup.id;
```

## 相关链接

- 规格文档: [spec.md](./spec.md)
- 修改的文件: `app/api/scripts/route.ts`
- 迁移脚本: `scripts/fix-preview-paths.mjs`
- 图片显示组件: `app/scripts/ScriptImagesCarousel.tsx`

## 总结

这是一个典型的**路径处理错误**导致的 bug：
- **原因**: 保存了绝对路径而不是相对路径
- **影响**: 自动生成的预览图无法显示
- **修复**: 1 行代码 + 数据迁移脚本
- **难度**: 低
- **重要性**: 高（影响用户体验）

通过这次修复，我们学到了：
1. **路径一致性很重要** - 应该统一使用相对路径
2. **测试要全面** - 需要测试不同的上传场景
3. **数据迁移很必要** - 修复代码后还需要修复历史数据

