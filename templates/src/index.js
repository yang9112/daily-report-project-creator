#!/usr/bin/env node

const Collector = require('./collector')
const Processor = require('./processor')
const Generator = require('./generator')

/**
 * 技术博客日报系统主程序
 */
async function main () {
  console.log('🚀 开始生成技术博客日报...')

  try {
    // 1. 采集新文章
    console.log('\n📡 第一步: 采集RSS文章...')
    const collector = new Collector()
    const collectedCount = await collector.collectAll()
    console.log(`✅ 采集完成，新增 ${collectedCount} 篇文章`)

    // 2. 处理AI摘��
    console.log('\n🤖 第二步: 生成AI摘要...')
    const processor = new Processor()
    const processedCount = await processor.processPending()
    console.log(`✅ 处理完成，处理 ${processedCount} 篇文章`)

    // 3. 生成日报
    console.log('\n📰 第三步: 生成日报...')
    const generator = new Generator()
    const digestPath = await generator.generateDigest()
    console.log(`✅ 日报生成完成: ${digestPath}`)

    console.log('\n🎉 技术博客日报生成完成！')
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }