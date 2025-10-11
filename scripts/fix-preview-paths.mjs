/**
 * 数据迁移脚本：修复自动生成预览图的路径问题
 * 
 * 问题：自动生成的预览图保存了绝对路径，导致图片无法显示
 * 解决：将绝对路径转换为相对路径
 * 
 * 运行方式：node scripts/fix-preview-paths.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPreviewPaths() {
  console.log('🔍 开始检查需要修复的预览图路径...')

  try {
    // 查找所有自动生成的预览图（路径以 / 开头的）
    const assets = await prisma.imageAsset.findMany({
      where: {
        mime: 'image/svg+xml',
        path: {
          startsWith: '/'
        }
      },
      include: {
        script: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    console.log(`📊 找到 ${assets.length} 个需要修复的预览图`)

    if (assets.length === 0) {
      console.log('✅ 没有需要修复的数据')
      return
    }

    let fixed = 0
    let failed = 0

    for (const asset of assets) {
      try {
        // 提取相对路径
        // 示例: /app/uploads/previews/script-123.svg -> previews/script-123.svg
        let relativePath = asset.path
        
        // 移除绝对路径前缀
        if (relativePath.includes('/uploads/')) {
          relativePath = relativePath.substring(relativePath.indexOf('/uploads/') + 9)
        } else if (relativePath.includes('uploads/')) {
          relativePath = relativePath.substring(relativePath.indexOf('uploads/') + 8)
        }
        
        // 如果路径仍然以 / 开头，移除它
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1)
        }

        console.log(`🔧 修复 [${asset.script.title}]:`)
        console.log(`   旧路径: ${asset.path}`)
        console.log(`   新路径: ${relativePath}`)

        // 更新数据库
        await prisma.imageAsset.update({
          where: { id: asset.id },
          data: { path: relativePath }
        })

        fixed++
        console.log(`   ✅ 修复成功`)

      } catch (error) {
        failed++
        console.error(`   ❌ 修复失败:`, error.message)
      }
    }

    console.log('\n📈 修复统计:')
    console.log(`   ✅ 成功: ${fixed}`)
    console.log(`   ❌ 失败: ${failed}`)
    console.log(`   📊 总计: ${assets.length}`)

    if (fixed > 0) {
      console.log('\n🎉 数据迁移完成！自动生成的预览图现在应该可以正常显示了。')
    }

  } catch (error) {
    console.error('❌ 迁移过程出错:', error)
    throw error
  }
}

// 执行迁移
fixPreviewPaths()
  .catch((error) => {
    console.error('💥 迁移失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })

