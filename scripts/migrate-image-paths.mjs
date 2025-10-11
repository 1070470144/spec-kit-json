/**
 * 数据迁移脚本：将图片路径从绝对路径转换为相对路径
 * 
 * 背景：为了环境无关性，统一使用相对路径存储图片路径
 * 运行方式：node scripts/migrate-image-paths.mjs
 */

import { PrismaClient } from '@prisma/client'
import { isAbsolute } from 'path'

const prisma = new PrismaClient()
const uploadDir = process.env.UPLOAD_DIR || './uploads'

async function migrateImagePaths() {
  console.log('🔍 开始检查图片路径格式...')
  console.log(`📁 上传目录: ${uploadDir}`)

  try {
    // 查找所有图片资源
    const allAssets = await prisma.imageAsset.findMany({
      include: {
        script: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    console.log(`📊 总共找到 ${allAssets.length} 个图片记录`)

    // 筛选出需要转换的（绝对路径）
    const assetsToMigrate = allAssets.filter(asset => {
      const path = asset.path
      // 检查是否是绝对路径
      return isAbsolute(path) || path.startsWith('/') || path.includes(':\\')
    })

    console.log(`📊 需要转换为相对路径的图片: ${assetsToMigrate.length}`)

    if (assetsToMigrate.length === 0) {
      console.log('✅ 所有图片路径已经是相对路径，无需迁移')
      return
    }

    let converted = 0
    let failed = 0
    let skipped = 0

    for (const asset of assetsToMigrate) {
      try {
        let relativePath = asset.path

        // 方法1: 移除 uploadDir 前缀
        if (relativePath.includes(uploadDir)) {
          const uploadDirNormalized = uploadDir.replace(/\\/g, '/')
          const pathNormalized = relativePath.replace(/\\/g, '/')
          
          if (pathNormalized.includes(uploadDirNormalized)) {
            relativePath = pathNormalized
              .substring(pathNormalized.indexOf(uploadDirNormalized) + uploadDirNormalized.length)
              .replace(/^[\/\\]+/, '')
          }
        }
        // 方法2: 查找 'uploads/' 并移除之前的所有内容
        else if (relativePath.includes('uploads/') || relativePath.includes('uploads\\')) {
          const pathNormalized = relativePath.replace(/\\/g, '/')
          const uploadsIndex = pathNormalized.indexOf('uploads/')
          if (uploadsIndex >= 0) {
            relativePath = pathNormalized.substring(uploadsIndex + 8)  // 'uploads/'.length === 8
          }
        }
        // 方法3: 移除开头的 / 或 \
        else if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
          relativePath = relativePath.substring(1)
        }

        // 如果转换后没有变化，跳过
        if (relativePath === asset.path) {
          console.log(`⏭️  跳过 [${asset.script.title}]: 路径未变化`)
          console.log(`   路径: ${asset.path}`)
          skipped++
          continue
        }

        console.log(`🔧 转换 [${asset.script.title}]:`)
        console.log(`   旧路径: ${asset.path}`)
        console.log(`   新路径: ${relativePath}`)

        // 更新数据库
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
    console.log(`   ✅ 成功转换: ${converted}`)
    console.log(`   ⏭️  跳过: ${skipped}`)
    console.log(`   ❌ 失败: ${failed}`)
    console.log(`   📊 总计检查: ${assetsToMigrate.length}`)

    if (converted > 0) {
      console.log('\n🎉 数据迁移完成！所有图片路径已转换为相对路径。')
      console.log('\n💡 提示: 重启开发服务器以使更改生效')
    }

  } catch (error) {
    console.error('❌ 迁移过程出错:', error)
    throw error
  }
}

// 执行迁移
migrateImagePaths()
  .catch((error) => {
    console.error('💥 迁移失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })

