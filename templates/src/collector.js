#!/usr/bin/env node

const fs = require('fs')
// eslint-disable-next-line no-unused-vars
const path = require('path')
const Parser = require('rss-parser')
// eslint-disable-next-line no-unused-vars
const axios = require('axios')

// eslint-disable-next-line no-unused-vars
const Database = require('./database')

/**
 * RSS订阅源采集器
 * 负责从各种RSS源采集技术文章
 */
class RSSCollector {
  constructor (config, sources = null, db = null) {
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        feed: ['image', 'language'],
        item: ['summary', 'content', 'encoded', 'categories']
      }
    })

    this.config = config
    this.db = db
    this.sources = sources || null
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        feed: ['image', 'language'],
        item: ['summary', 'content', 'encoded', 'categories']
      }
    })

    this.outputDir = config.outputDir || './data'
    this.maxArticles = config.maxArticles || 100
    this.timeout = config.timeout || 30000

    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * 从所有源采��文章
   */
  async collectAll () {
    console.log('🔄 开始采集RSS源...')
    
    // 如果没有设置sources，从配置中获取
    let sources = this.sources
    if (!sources && this.config && this.config.sources) {
      sources = this.config.sources
    }
    
    if (!sources || sources.length === 0) {
      console.log('⚠️  没有找到RSS源配置')
      return []
    }

    const allArticles = []

    for (const source of sources) {
      try {
        console.log(`📡 采集源: ${source.name}`)
        const articles = await this.collectFromSource(source)
        allArticles.push(...articles)
        console.log(`✅ 从 ${source.name} 采集到 ${articles.length} 篇文章`)
      } catch (error) {
        console.error(`❌ 采集 ${source.name} 失败:`, error.message)
      }
    }

    // 去重和排序
    const uniqueArticles = this.deduplicateArticles(allArticles)
    const sortedArticles = this.sortArticlesByDate(uniqueArticles)

    // 保存结果
    await this.saveArticles(sortedArticles)

    console.log(`🎉 采集完成，共 ${sortedArticles.length} 篇唯一文章`)
    return sortedArticles
  }

  /**
   * 从单个源采集文章
   */
  async collectFromSource (source) {
    const feed = await this.parser.parseURL(source.url)

    const articles = feed.items.map(item => ({
      title: this.cleanText(item.title),
      link: item.link,
      description: this.cleanText(item.description || item.summary || ''),
      content: this.cleanText(item.content || item['content:encoded'] || ''),
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      guid: item.guid || item.link,
      source: source.name,
      category: source.category || 'general',
      author: item.author || item.creator || '',
      tags: this.extractTags(item.categories || [])
    }))

    // 过滤和限制数量
    return articles
      .filter(article => this.isValidArticle(article))
      .slice(0, source.maxArticles || this.maxArticles)
  }

  /**
   * 文章去重（基于链接）
   */
  deduplicateArticles (articles) {
    const seen = new Set()
    return articles.filter(article => {
      if (seen.has(article.link)) {
        return false
      }
      seen.add(article.link)
      return true
    })
  }

  /**
   * 按发布日期排序
   */
  sortArticlesByDate (articles) {
    return articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  }

  /**
   * 验证文章有效性
   */
  isValidArticle (article) {
    if (!article.title || !article.link) return false
    if (article.title.length > 200) return false
    if (new Date(article.pubDate).isNaN()) return false
    if (this.isTooOld(article.pubDate)) return false
    return true
  }

  /**
   * 检查文章是否过期
   */
  isTooOld (pubDate, daysOld = 30) {
    const articleDate = new Date(pubDate)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    return articleDate < cutoffDate
  }

  /**
   * 清理文本内容
   */
  cleanText (text) {
    if (!text) return ''
    return text
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim()
  }

  /**
   * 提取标签
   */
  extractTags (categories) {
    if (!Array.isArray(categories)) return []
    return categories.map(cat =>
      typeof cat === 'string' ? cat : cat.$.term || cat._ || ''
    ).filter(tag => tag.length > 0)
  }

  /**
   * 保存文章到文件
   */
  async saveArticles (articles) {
    const filename = `articles-${new Date().toISOString().split('T')[0]}.json`
    const filepath = path.join(this.outputDir, filename)

    fs.writeFileSync(filepath, JSON.stringify({
      articles,
      collectedAt: new Date().toISOString(),
      total: articles.length
    }, null, 2))

    console.log(`💾 文章已保存到: ${filepath}`)
  }

  /**
   * 获取统计信息
   */
  getStats (articles) {
    const sources = {}
    const categories = {}

    articles.forEach(article => {
      sources[article.source] = (sources[article.source] || 0) + 1
      categories[article.category] = (categories[article.category] || 0) + 1
    })

    return {
      total: articles.length,
      sources,
      categories,
      dateRange: {
        earliest: new Date(Math.min(...articles.map(a => new Date(a.pubDate)))),
        latest: new Date(Math.max(...articles.map(a => new Date(a.pubDate))))
      }
    }
  }

  /**
   * 采集所有源的文章
   * 适配器方法，兼容不同的调用接口
   */
  async collectAll() {
    try {
      const result = await this.collectFeeds()
      return result.total || 0
    } catch (error) {
      console.error('采集所有文章失败:', error.message)
      return 0
    }
  }
}

module.exports = RSSCollector
