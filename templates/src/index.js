#!/usr/bin/env node

require('dotenv').config()

// eslint-disable-next-line no-unused-vars
const Database = require('./database')
const RSSCollector = require('./collector')
const AIProcessor = require('./processor')
const DailyReportGenerator = require('./generator')
const Utils = require('./utils')

/**
 * 技术博客日报系统主程序
 * 整合文章采集、AI处理和报告生成功能
 */
class TechDailyDigest {
  constructor (configPath = './config/config.json') {
    this.configPath = configPath
    this.config = null
    this.db = null
    this.collector = null
    this.processor = null
    this.generator = null
  }

  /**
   * 初始化系统
   */
  async init () {
    try {
      console.log('🚀 初始化技术日报系统...')

      // 加载配置
      await this.loadConfig()

      // 初始化数据库
      this.db = new Database(this.config)
      await this.db.connect()

      // 初始化各组件
      this.collector = new RSSCollector(this.config, this.config.sources, this.db)

      this.processor = new AIProcessor(this.config, this.db)

      this.generator = new DailyReportGenerator(this.config, this.db)

      console.log('✅ 系统初始化完成')
    } catch (error) {
      console.error('❌ 初始化失败:', error.message)
      throw error
    }
  }

  /**
   * 加载配置文件
   */
  async loadConfig () {
    this.config = Utils.readJsonFile(this.configPath)

    if (!this.config) {
      console.warn('⚠️ 配置文件不存在，使用默认配置')
      this.config = this.getDefaultConfig()
      await Utils.writeJsonFile(this.configPath, this.config)
    }

    // 验证必要配置
    if (!this.config.sources || this.config.sources.length === 0) {
      throw new Error('请在配置文件中至少添加一个RSS源')
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig () {
    return {
      sources: [
        {
          name: 'Hacker News',
          url: 'https://news.ycombinator.com/rss',
          category: 'tech',
          maxArticles: 20
        },
        {
          name: 'TechCrunch',
          url: 'https://techcrunch.com/feed/',
          category: 'tech',
          maxArticles: 15
        }
      ],
      collector: {
        maxArticles: 100,
        timeout: 30000
      },
      ai: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        batchSize: 5,
        maxTokens: 1000,
        temperature: 0.7
      },
      generator: {
        maxArticles: 20,
        minRelevanceScore: 6
      },
      database: {
        path: './data/daily-report.db'
      },
      schedule: {
        enabled: true,
        cron: '0 8 * * *' // 每天8点运行
      }
    }
  }

  /**
   * 运行完整流程
   */
  async run () {
    try {
      await this.init()

      console.log('📡 开始采集文章...')
      const articles = await this.collectArticles()

      console.log('🤖 开始处理文章...')
      const processedArticles = await this.processArticles(articles)

      console.log('💾 保存处理结果...')
      await this.saveProcessedArticles(processedArticles)

      console.log('📰 生成日报...')
      const reportPaths = await this.generateDailyReport(processedArticles)

      console.log('\n🎉 技术日报生成完成！')
      console.log(`📊 处理文章: ${processedArticles.length} 篇`)

      if (reportPaths.markdown) {
        console.log(`📄 Markdown报告: ${reportPaths.markdown}`)
      }
      if (reportPaths.html) {
        console.log(`🌐 HTML报告: ${reportPaths.html}`)
      }

      return reportPaths
    } catch (error) {
      console.error('❌ 系统运行出错:', error.message)
      console.error(error.stack)
      throw error
    } finally {
      if (this.db) {
        this.db.close()
      }
    }
  }

  /**
   * 仅采集文章
   */
  async collectOnly () {
    await this.init()
    const articles = await this.collectArticles()

    if (this.db) {
      this.db.close()
    }

    return articles
  }

  /**
   * 仅处理文章
   */
  async processOnly () {
    await this.init()

    console.log('📋 获取未处理文章...')
    const unprocessedArticles = await this.db.getUnprocessedArticles(50)

    if (unprocessedArticles.length === 0) {
      console.log('ℹ️ 没有需要处理的文章')
      return []
    }

    console.log(`🤖 处理 ${unprocessedArticles.length} 篇文章...`)
    const processedArticles = await this.processArticles(unprocessedArticles)

    console.log('💾 保存处理结果...')
    await this.saveProcessedArticles(processedArticles)

    if (this.db) {
      this.db.close()
    }

    return processedArticles
  }

  /**
   * 仅生成报告
   */
  async generateOnly (date = null) {
    await this.init()

    const targetDate = date || Utils.formatDate(new Date(), 'YYYY-MM-DD')
    const startDate = Utils.getStartOfDay(targetDate)
    const endDate = Utils.getEndOfDay(targetDate)

    console.log('📋 获取精选文章...')
    const featuredArticles = await this.db.getFeaturedArticles(
      startDate.toISOString(),
      endDate.toISOString(),
      50
    )

    if (featuredArticles.length === 0) {
      // 如果没有精选文章，获取最近的高质量文章
      console.log('⚠️ 无当日精选文章，使用最近的高质量文章...')
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 3)
      const articles = await this.db.getFeaturedArticles(
        recentDate.toISOString(),
        endDate.toISOString(),
        50
      )

      if (articles.length > 0) {
        const reportPaths = await this.generateDailyReport(articles)
        if (this.db) {
          this.db.close()
        }
        return reportPaths
      }

      throw new Error('没有可用的文章生成报告')
    }

    const reportPaths = await this.generateDailyReport(featuredArticles)

    if (this.db) {
      this.db.close()
    }

    return reportPaths
  }

  /**
   * 采集文章
   */
  async collectArticles () {
    const articles = await this.collector.collectAll()

    if (this.db && articles.length > 0) {
      await this.db.saveArticles(articles)
    }

    return articles
  }

  /**
   * 处理文章
   */
  async processArticles (articles) {
    return await this.processor.processAll(articles)
  }

  /**
   * 保存处理结果
   */
  async saveProcessedArticles (articles) {
    if (!this.db) return

    for (const article of articles) {
      try {
        // 查找对应的数据库记录
        const existingArticles = await this.db.query(
          'SELECT id FROM articles WHERE link = ?',
          [article.link]
        )

        if (existingArticles.length > 0) {
          await this.db.markArticleProcessed(existingArticles[0].id, {
            summary: article.summary,
            sentiment: article.sentiment,
            relevanceScore: article.relevanceScore,
            keywords: article.keywords
          })
        }
      } catch (error) {
        console.error(`❌ 保存文章处理结果失败: ${article.title}`, error.message)
      }
    }
  }

  /**
   * 生成日报
   */
  async generateDailyReport (articles) {
    // 保存报告记录
    if (this.db) {
      await this.db.saveReport({
        date: Utils.formatDate(new Date(), 'YYYY-MM-DD'),
        totalArticles: articles.length,
        featuredArticles: articles.filter(a => a.relevanceScore >= 8).length,
        generatedAt: new Date().toISOString()
      })
    }

    return await this.generator.generateReport(articles)
  }

  /**
   * 显示系统状态
   */
  async status () {
    await this.init()

    try {
      const stats = await this.db.getStatistics(30)
      const sourceStats = await this.db.getSourceStats()
      const dbSize = await this.db.getDatabaseSize()

      console.log('\n📊 系统状态报告')
      console.log('='.repeat(50))
      console.log(`📦 数据库大小: ${dbSize.sizeMB} MB`)
      console.log(`📰 最近30天文章: ${stats.total_articles} 篇`)
      console.log(`✅ 已处理: ${stats.processed_articles} 篇`)
      console.log(`⭐ 精选文章: ${stats.featured_articles} 篇`)
      console.log(`🔗 活跃源: ${stats.unique_sources} 个`)
      console.log(`📅 活跃天数: ${stats.active_days} 天`)

      console.log('\n📡 RSS源状态:')
      sourceStats.forEach(source => {
        console.log(`  ${source.name}: ${source.article_count} 篇文章 (${source.processed_count} 已处理)`)
      })
    } catch (error) {
      console.error('❌ 获取状态失败:', error.message)
    }
  }

  /**
   * 测试AI连接
   */
  async testAI () {
    await this.init()

    try {
      const success = await this.processor.testConnection()
      if (success) {
        console.log('✅ AI连接测试成功')
      } else {
        console.log('❌ AI连接测试失败')
      }
    } catch (error) {
      console.error('❌ AI测试失败:', error.message)
    } finally {
      if (this.db) {
        this.db.close()
      }
    }
  }

  /**
   * 清理旧数据
   */
  async cleanup (daysToKeep = 90) {
    await this.init()

    try {
      const deletedCount = await this.db.cleanupOldData(daysToKeep)
      console.log(`🧹 清理完成，删除了 ${deletedCount} 条旧文章记录`)
    } catch (error) {
      console.error('❌ 清理失败:', error.message)
    } finally {
      if (this.db) {
        this.db.close()
      }
    }
  }
}

// 命令行参数处理
async function main () {
  const args = process.argv.slice(2)
  const command = args[0]
  const option = args[1]

  const app = new TechDailyDigest()

  try {
    switch (command) {
      case '--help':
      case '-h':
        console.log(`
技术博客日报系统

用法:
  node index.js [command] [option]

命令:
  run                    # 运行完整流程（采集+处理+生成）
  collect                # 仅采集文章
  process                # 仅处理文章摘要
  generate [date]        # 仅生成日报 (可选日期，格式 YYYY-MM-DD)
  status                 # 查看系统状态
  test                   # 测试AI连接
  cleanup [days]         # 清理旧数据 (默认保留90天)

示例:
  node index.js                  # 运行完整流程
  node index.js collect          # 仅采集
  node index.js generate         # 生成今日报告
  node index.js generate 2024-01-15  # 生成指定日期报告
  node index.js status           # 查看状态
  node index.js cleanup 30       # 清理30天前的数据
`)
        break

      case 'run':
        await app.run()
        break

      case 'collect':
        await app.collectOnly()
        break

      case 'process':
        await app.processOnly()
        break

      case 'generate':
        await app.generateOnly(option)
        break

      case 'status':
        await app.status()
        break

      case 'test':
        await app.testAI()
        break

      case 'cleanup':
        await app.cleanup(parseInt(option) || 90)
        break

      default:
        // 默认运行完整流程
        await app.run()
        break
    }
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = TechDailyDigest
