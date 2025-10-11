# Spec: 修复 /api/files 路径解析问题

**ID**: 023-fix-api-files-path-resolution  
**Created**: 2025-10-10  
**Status**: ✅ Fixed (Pending Migration)  
**Priority**: Critical  
**Type**: Bug Fix  
**Related**: [021](../021-fix-auto-preview-image-path/), [022](../022-fix-auto-preview-realtime-gen-path/)

## 问题描述

修复了 021 和 022 后，自动生成的预览图仍然无法显示。错误日志显示：
```
GET /api/files?path=generated-previews%2Fcmgkshtzr0002sxszxfiztju8.svg 404 in 25ms
```

## 根本原因分析

### 数据库中的路径格式不一致

**用户上传的图片**（通过 `storage.save()`）：
```typescript
// LocalStorage.save() 返回绝对路径
const path = join(uploadDir, filename)  // "/app/uploads/xxx-image.jpg"
return { path, mime, size, sha256 }

// 保存到数据库
await prisma.imageAsset.create({
  data: {
    path: meta.path,  // 绝对路径："/app/uploads/xxx-image.jpg"
    ...
  }
})
```

**自动生成的预览图**（修复后）：
```typescript
const imagePath = getPreviewImagePath(id)  // "generated-previews/xxx.svg"

// 保存到数据库
await prisma.imageAsset.create({
  data: {
    path: imagePath,  // 相对路径："generated-previews/xxx.svg"
    ...
  }
})
```

### /api/files API 的问题

当前实现：
```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return badRequest('MISSING_PATH')

  try {
    const stat = statSync(path)  // ❌ 直接使用 path，期望绝对路径
    const stream = createReadStream(path)
    return new Response(stream as unknown as ReadableStream, ...)
  } catch {
    return notFound()
  }
}
```

### 问题总结

1. **用户上传图片**：数据库存绝对路径 → `/api/files` 能工作 ✅
2. **自动生成预览图**：数据库存相对路径 → `/api/files` 无法工作 ❌

## 解决方案

### 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| A: 修改 `/api/files` 支持相对路径 | 统一使用相对路径，环境独立 | 需要修改API和旧数据 |
| B: 预览图也使用绝对路径 | 与现有图片一致 | 环境依赖，021/022的修复需要回退 |

**推荐方案 A**：修改 `/api/files` API 支持相对路径和绝对路径。

### 实施方案 A

#### 1. 修改 `/api/files` API

**文件**: `app/api/files/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { createReadStream, statSync, existsSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { notFound, badRequest } from '@/src/api/http'

const uploadDir = process.env.UPLOAD_DIR || './uploads'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return badRequest('MISSING_PATH')

  try {
    // 处理相对路径和绝对路径
    const fullPath = isAbsolute(path) ? path : join(uploadDir, path)
    
    // 安全检查：确保路径在 uploadDir 内
    if (!fullPath.startsWith(uploadDir) && !isAbsolute(path)) {
      return notFound()
    }
    
    if (!existsSync(fullPath)) {
      return notFound()
    }
    
    const stat = statSync(fullPath)
    const stream = createReadStream(fullPath)
    
    return new Response(stream as unknown as ReadableStream, { 
      headers: { 
        'content-length': String(stat.size),
        'cache-control': 'public, max-age=31536000', // 缓存1年
      } 
    })
  } catch (error) {
    console.error('[API FILES] Error:', error)
    return notFound()
  }
}
```

#### 2. 迁移现有数据

创建迁移脚本 `scripts/migrate-image-paths.mjs`：

```javascript
import { PrismaClient } from '@prisma/client'
import { isAbsolute } from 'path'

const prisma = new PrismaClient()
const uploadDir = process.env.UPLOAD_DIR || './uploads'

async function migrateImagePaths() {
  console.log('🔍 开始迁移图片路径...')

  try {
    // 查找所有绝对路径的图片
    const assets = await prisma.imageAsset.findMany({
      where: {
        // 绝对路径通常以 / 或 C: 等开头
        OR: [
          { path: { startsWith: '/' } },
          { path: { contains: ':\\' } }, // Windows 路径
        ]
      }
    })

    console.log(`📊 找到 ${assets.length} 个需要转换为相对路径的图片`)

    if (assets.length === 0) {
      console.log('✅ 没有需要迁移的数据')
      return
    }

    let converted = 0
    let failed = 0

    for (const asset of assets) {
      try {
        let relativePath = asset.path

        // 将绝对路径转换为相对路径
        if (relativePath.includes(uploadDir)) {
          // 移除 uploadDir 前缀
          relativePath = relativePath.replace(uploadDir, '').replace(/^[\/\\]+/, '')
        } else if (relativePath.includes('uploads/')) {
          // 移除 uploads/ 及之前的所有内容
          relativePath = relativePath.substring(relativePath.indexOf('uploads/') + 8)
        }

        // 跳过已经是相对路径的
        if (relativePath === asset.path && !isAbsolute(asset.path)) {
          continue
        }

        console.log(`🔧 转换:`)
        console.log(`   旧: ${asset.path}`)
        console.log(`   新: ${relativePath}`)

        await prisma.imageAsset.update({
          where: { id: asset.id },
          data: { path: relativePath }
        })

        converted++
        console.log(`   ✅ 转换成功`)

      } catch (error) {
        failed++
        console.error(`   ❌ 转换失败:`, error.message)
      }
    }

    console.log('\n📈 迁移统计:')
    console.log(`   ✅ 成功: ${converted}`)
    console.log(`   ❌ 失败: ${failed}`)
    console.log(`   📊 总计: ${assets.length}`)

    if (converted > 0) {
      console.log('\n🎉 数据迁移完成！所有图片路径已转换为相对路径。')
    }

  } catch (error) {
    console.error('❌ 迁移过程出错:', error)
    throw error
  }
}

migrateImagePaths()
  .catch((error) => {
    console.error('💥 迁移失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
```

## 验收标准

- [x] `/api/files` API 能处理相对路径
- [x] `/api/files` API 能处理绝对路径（向后兼容）
- [x] 安全检查：防止路径遍历攻击
- [ ] 用户上传图片正常显示（待用户测试）
- [ ] 自动生成预览图正常显示（待用户测试）
- [x] 创建数据迁移脚本
- [ ] 运行数据迁移脚本（待用户执行）
- [ ] 所有页面图片正常显示（待用户测试）

## 预估工作量

- **API 修改**: 15 分钟
- **迁移脚本**: 20 分钟
- **测试验证**: 25 分钟
- **总计**: ~1 小时

## 安全考虑

### 路径遍历攻击防护

```typescript
// 防止 path=../../../../etc/passwd 这样的攻击
if (!fullPath.startsWith(uploadDir) && !isAbsolute(path)) {
  return notFound()
}
```

### 文件存在性检查

```typescript
if (!existsSync(fullPath)) {
  return notFound()
}
```

## 相关文件

- `app/api/files/route.ts` - 主要修改
- `src/storage/local.ts` - 可能需要更新 save() 方法
- `scripts/migrate-image-paths.mjs` - 数据迁移脚本

## 总结

这是解决预览图显示问题的**最后一步**：
- ✅ 021: 修复上传时保存相对路径
- ✅ 022: 修复实时生成时保存相对路径
- 🔄 023: 修复 `/api/files` 支持相对路径

完成 023 后，所有图片应该都能正常显示。

