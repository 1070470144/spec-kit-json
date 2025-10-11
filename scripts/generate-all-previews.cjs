#!/usr/bin/env node

/**
 * 批量生成所有剧本的预览图
 * 用于初次部署或批量更新预览图
 */

const { PrismaClient } = require('@prisma/client')

async function generateAllPreviews() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🎨 开始批量生成剧本预览图...\n')
    
    // 获取所有没有预览图的剧本
    const scripts = await prisma.script.findMany({
      where: {
        state: 'published', // 只处理已发布的剧本
        images: {
          none: {} // 没有上传图片的剧本
        }
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 找到 ${scripts.length} 个需要生成预览图的剧本`)
    
    if (scripts.length === 0) {
      console.log('✅ 所有剧本都已有预览图！')
      return
    }
    
    let success = 0
    let failed = 0
    
    // 批量生成
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i]
      const progress = `[${i + 1}/${scripts.length}]`
      
      try {
        console.log(`${progress} 正在生成: ${script.title}`)
        
        // 发送生成请求
        const response = await fetch(`http://localhost:3000/api/scripts/${script.id}/generate-preview`, {
          method: 'POST'
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`${progress} ✅ 成功 - ${result.data?.generationTime || 0}ms`)
          success++
        } else {
          console.log(`${progress} ❌ 失败 - ${response.status} ${response.statusText}`)
          failed++
        }
        
      } catch (error) {
        console.log(`${progress} ❌ 错误 - ${error.message}`)
        failed++
      }
      
      // 避免过快请求，间隔100ms
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('\n📋 批量生成完成!')
    console.log(`✅ 成功: ${success} 个`)
    console.log(`❌ 失败: ${failed} 个`)
    console.log(`📊 成功率: ${Math.round((success / scripts.length) * 100)}%`)
    
    if (failed > 0) {
      console.log('\n💡 建议:')
      console.log('1. 检查开发服务器是否正常运行 (npm run dev)')
      console.log('2. 确认存储目录权限正确')
      console.log('3. 检查剧本JSON数据格式是否正确')
    }
    
  } catch (error) {
    console.error('❌ 批量生成失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 检查服务器状态
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      console.log('✅ 服务器运行正常')
      return true
    } else {
      console.log('⚠️  服务器响应异常:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ 无法连接服务器:', error.message)
    console.log('\n请先启动开发服务器:')
    console.log('  npm run dev')
    return false
  }
}

// 主函数
async function main() {
  console.log('🚀 剧本预览图批量生成工具\n')
  
  // 检查服务器
  const serverOk = await checkServerStatus()
  if (!serverOk) {
    process.exit(1)
  }
  
  // 询问用户确认
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const answer = await new Promise(resolve => {
    rl.question('确定要开始批量生成预览图吗？(y/N): ', resolve)
  })
  
  rl.close()
  
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('❌ 操作已取消')
    process.exit(0)
  }
  
  await generateAllPreviews()
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程序执行失败:', error)
    process.exit(1)
  })
}
