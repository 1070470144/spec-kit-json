#!/usr/bin/env node

/**
 * API 性能测试工具
 * 用于测试优化前后的API响应时间
 */

const http = require('http')
const https = require('https')

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const TEST_ENDPOINTS = [
  '/api/site-config',
  '/api/me',
  '/api/health'
]

// 性能测试函数
async function testEndpoint(url, iterations = 5) {
  const results = []
  
  console.log(`\n🧪 测试: ${url}`)
  console.log('─'.repeat(50))
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${BASE_URL}${url}`)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      results.push({
        iteration: i + 1,
        duration,
        status: response.status,
        success: true
      })
      
      console.log(`  ${i + 1}. ${duration}ms (${response.status})`)
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      results.push({
        iteration: i + 1,
        duration,
        status: 0,
        success: false,
        error: error.message
      })
      
      console.log(`  ${i + 1}. ${duration}ms (ERROR: ${error.message})`)
    }
    
    // 间隔100ms避免并发影响
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

// 计算统计信息
function calculateStats(results) {
  const successResults = results.filter(r => r.success)
  
  if (successResults.length === 0) {
    return {
      avg: 0,
      min: 0,
      max: 0,
      successRate: 0,
      totalRequests: results.length
    }
  }
  
  const durations = successResults.map(r => r.duration)
  
  return {
    avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    min: Math.min(...durations),
    max: Math.max(...durations),
    successRate: Math.round((successResults.length / results.length) * 100),
    totalRequests: results.length
  }
}

// 主测试函数
async function runPerformanceTest() {
  console.log('🚀 API 性能测试开始...')
  console.log(`📍 测试地址: ${BASE_URL}`)
  console.log(`📊 每个端点测试 5 次`)
  
  const allResults = {}
  
  for (const endpoint of TEST_ENDPOINTS) {
    const results = await testEndpoint(endpoint)
    const stats = calculateStats(results)
    
    allResults[endpoint] = {
      results,
      stats
    }
    
    console.log(`\n📈 统计结果:`)
    console.log(`   平均响应时间: ${stats.avg}ms`)
    console.log(`   最快响应时间: ${stats.min}ms`)
    console.log(`   最慢响应时间: ${stats.max}ms`)
    console.log(`   成功率: ${stats.successRate}%`)
  }
  
  // 生成总结报告
  console.log('\n' + '='.repeat(60))
  console.log('📋 性能测试总结报告')
  console.log('='.repeat(60))
  
  console.log('端点'.padEnd(20) + '平均响应'.padEnd(10) + '最小'.padEnd(8) + '最大'.padEnd(8) + '成功率')
  console.log('─'.repeat(60))
  
  for (const [endpoint, data] of Object.entries(allResults)) {
    const { stats } = data
    const endpointName = endpoint.padEnd(20)
    const avgTime = `${stats.avg}ms`.padEnd(10)
    const minTime = `${stats.min}ms`.padEnd(8)
    const maxTime = `${stats.max}ms`.padEnd(8)
    const successRate = `${stats.successRate}%`
    
    console.log(`${endpointName}${avgTime}${minTime}${maxTime}${successRate}`)
  }
  
  // 性能评估
  console.log('\n🎯 性能评估:')
  
  for (const [endpoint, data] of Object.entries(allResults)) {
    const { stats } = data
    let grade = 'A'
    let comment = '优秀'
    
    if (stats.avg > 500) {
      grade = 'C'
      comment = '需要优化'
    } else if (stats.avg > 200) {
      grade = 'B'
      comment = '良好'
    }
    
    if (stats.successRate < 100) {
      grade = 'D'
      comment = '存在错误'
    }
    
    console.log(`   ${endpoint}: ${grade}级 (${comment}) - 平均${stats.avg}ms`)
  }
  
  // 优化建议
  const slowEndpoints = Object.entries(allResults)
    .filter(([_, data]) => data.stats.avg > 200)
    .map(([endpoint, _]) => endpoint)
  
  if (slowEndpoints.length > 0) {
    console.log('\n💡 优化建议:')
    for (const endpoint of slowEndpoints) {
      console.log(`   - ${endpoint}: 响应时间过慢，建议检查数据库查询和缓存策略`)
    }
  } else {
    console.log('\n✅ 所有API响应时间都在可接受范围内！')
  }
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('\n❌ 测试失败:', error.message)
  process.exit(1)
})

// 启动测试
if (require.main === module) {
  runPerformanceTest()
    .then(() => {
      console.log('\n✅ 性能测试完成!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ 测试失败:', error)
      process.exit(1)
    })
}
