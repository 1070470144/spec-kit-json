// 检查最近上传的剧本
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== 检查最近上传的剧本 ===\n')
  
  // 查询最近10个剧本
  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      state: true,
      createdById: true,
      createdAt: true,
      systemOwned: true
    }
  })
  
  if (scripts.length === 0) {
    console.log('❌ 数据库中没有任何剧本！')
    return
  }
  
  console.log(`✅ 找到 ${scripts.length} 个剧本：\n`)
  
  scripts.forEach((s, i) => {
    console.log(`${i + 1}. ${s.title}`)
    console.log(`   ID: ${s.id}`)
    console.log(`   状态: ${s.state}`)
    console.log(`   创建者ID: ${s.createdById || '❌ NULL（未登录上传）'}`)
    console.log(`   系统接管: ${s.systemOwned ? '是' : '否'}`)
    console.log(`   创建时间: ${s.createdAt.toLocaleString('zh-CN')}`)
    console.log()
  })
  
  // 统计各状态的剧本数量
  const stats = await prisma.script.groupBy({
    by: ['state'],
    _count: true
  })
  
  console.log('=== 剧本状态统计 ===\n')
  stats.forEach(s => {
    console.log(`${s.state}: ${s._count} 个`)
  })
  
  // 检查有多少剧本的 createdById 是 null
  const nullOwnerCount = await prisma.script.count({
    where: { createdById: null }
  })
  
  if (nullOwnerCount > 0) {
    console.log(`\n⚠️  警告: 有 ${nullOwnerCount} 个剧本的创建者ID为空（未登录上传）`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

