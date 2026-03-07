#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const axios = require('axios')
// eslint-disable-next-line no-unused-vars
const Database = require('./database')

/**
 * AI摘要处理器
 * 负责使用AI对文章进行摘要和关键词提取
 */
class AIProcessor {
  constructor (config, db = null) {
    this.config = config
    this.db = db

    // 初始化AI客户端
    this.aiClient = null
    this.initAIClient()

    this.outputDir = (config.digest && config.digest.output_dir) || './data'
    this.batchSize = config.batchSize || 5
  }

  initAIClient () {
    // 兼容两种配置格式
    const llmConfig = this.config.llm || this.config.ai || {}
    const { provider, apiKey, baseUrl } = llmConfig

    const actualProvider = provider || 'openai'
    const actualApiKey = apiKey || process.env.OPENAI_API_KEY
    const actualBaseUrl = baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

    if (actualProvider === 'openai' || actualProvider === 'openai-compatible') {
      const OpenAI = require('openai')
      this.aiClient = new OpenAI({
        apiKey: actualApiKey,
        baseURL: actualBaseUrl
      })
    } else {
      throw new Error(`不支持的AI提供商: ${actualProvider}`)
    }

    // API配置
    this.apiKey = actualApiKey
    this.apiConfig = {
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        chatEndpoint: '/chat/completions',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      deepseek: {
        baseUrl: 'https://api.deepseek.com',
        chatEndpoint: '/chat/completions',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    }

    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * 处理所有文章
   */
  async processAll (articles) {
    console.log('🤖 开始AI处理文章...')
    const processedArticles = []

    // 分批处理
    for (let i = 0; i < articles.length; i += this.batchSize) {
      const batch = articles.slice(i, i + this.batchSize)
      console.log(`📝 处理批次 ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(articles.length / this.batchSize)}`)

      const batchResults = await this.processBatch(batch)
      processedArticles.push(...batchResults)

      // 添加延迟避免API限流
      if (i + this.batchSize < articles.length) {
        await this.delay(1000)
      }
    }

    // 保存处理结果
    await this.saveProcessedArticles(processedArticles)

    console.log(`✅ 处理完成，共处理 ${processedArticles.length} 篇文章`)
    return processedArticles
  }

  /**
   * 处理单个批次的文章
   */
  async processBatch (articles) {
    const promises = articles.map(article => this.processArticle(article))
    const results = await Promise.allSettled(promises)

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`❌ 处理文章失败: ${articles[index].title}`, result.reason)
        return {
          ...articles[index],
          summary: '处理失败',
          keywords: [],
          processedAt: new Date().toISOString(),
          processingError: result.reason.message
        }
      }
    })
  }

  /**
   * 处理单篇文章
   */
  async processArticle (article) {
    const prompt = this.buildPrompt(article)
    const response = await this.callAI(prompt)

    return {
      ...article,
      summary: response.summary,
      keywords: response.keywords,
      sentiment: response.sentiment,
      relevanceScore: response.relevanceScore,
      processedAt: new Date().toISOString()
    }
  }

  /**
   * 构建AI提示词
   */
  buildPrompt (article) {
    return `请分析以下技术文章，提供中文摘要和关键词提取：

标题：${article.title}
来源：${article.source}
内容：${article.content || article.description}

请按以下格式回复：
摘要：[用1-2句话概括文章核心内容，50字以内]
关键词：[3-5个核心技术关键词，用逗号分隔]
情感倾向：[正面/中性/负面]
相关度：[1-10分，对技术读者的相关度]`
  }

  /**
   * 调用AI API
   */
  async callAI (prompt) {
    const config = this.apiConfig[this.apiProvider]
    if (!config) {
      throw new Error(`不支持的API提供商: ${this.apiProvider}`)
    }

    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的技术文章分析助手，擅长从技术文章中提取关键信息和摘要。请严格按照指定格式回复。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature
    }

    try {
      const response = await axios.post(
        config.baseUrl + config.chatEndpoint,
        requestData,
        {
          headers: config.headers,
          timeout: 30000
        }
      )

      const content = response.data.choices[0].message.content
      return this.parseAIResponse(content)
    } catch (error) {
      throw new Error(`AI API调用失败: ${error.message}`)
    }
  }

  /**
   * 解析AI响应
   */
  parseAIResponse (content) {
    const lines = content.split('\n')
    const result = {
      summary: '',
      keywords: [],
      sentiment: '中性',
      relevanceScore: 5
    }

    lines.forEach(line => {
      line = line.trim()
      if (line.startsWith('摘要：')) {
        result.summary = line.substring(3).trim()
      } else if (line.startsWith('关键词：')) {
        const keywords = line.substring(4).trim()
        result.keywords = keywords.split(/[,，]/).map(k => k.trim()).filter(k => k.length > 0)
      } else if (line.startsWith('情感倾向：')) {
        result.sentiment = line.substring(5).trim()
      } else if (line.startsWith('相关度：')) {
        const score = parseInt(line.substring(4).trim())
        result.relevanceScore = isNaN(score) ? 5 : Math.max(1, Math.min(10, score))
      }
    })

    // 处理异常情况
    if (!result.summary) {
      result.summary = '无法生成摘要'
    }
    if (result.keywords.length === 0) {
      result.keywords = ['技术']
    }

    return result
  }

  /**
   * 保存处理后的文章
   */
  async saveProcessedArticles (articles) {
    const filename = `processed-articles-${new Date().toISOString().split('T')[0]}.json`
    const filepath = path.join(this.outputDir, filename)

    const processedData = {
      articles,
      processedAt: new Date().toISOString(),
      total: articles.length,
      apiProvider: this.apiProvider,
      model: this.model
    }

    fs.writeFileSync(filepath, JSON.stringify(processedData, null, 2))
    console.log(`💾 处理结果已保存到: ${filepath}`)
  }

  /**
   * 获取处理统计
   */
  getProcessingStats (articles) {
    const stats = {
      total: articles.length,
      processed: articles.filter(a => !a.processingError).length,
      failed: articles.filter(a => a.processingError).length,
      avgRelevanceScore: 0,
      sentimentDistribution: { 正面: 0, 中性: 0, 负面: 0 },
      topKeywords: {}
    }

    // 计算平均相关度
    const validScores = articles.filter(a => a.relevanceScore).map(a => a.relevanceScore)
    if (validScores.length > 0) {
      stats.avgRelevanceScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    }

    // 统计情感分布
    articles.forEach(article => {
      if (article.sentiment) {
        stats.sentimentDistribution[article.sentiment] =
          (stats.sentimentDistribution[article.sentiment] || 0) + 1
      }

      // 统计关键词频率
      if (article.keywords) {
        article.keywords.forEach(keyword => {
          stats.topKeywords[keyword] = (stats.topKeywords[keyword] || 0) + 1
        })
      }
    })

    // 排序Top关键词
    stats.topKeywords = Object.entries(stats.topKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
      }, {})

    return stats
  }

  /**
   * 延迟函数
   */
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 测试AI连接
   */
  async testConnection () {
    try {
      const testPrompt = '请回复"连接正常"'
      await this.callAI(testPrompt)
      console.log('✅ AI连接测试成功')
      return true
    } catch (error) {
      console.error('❌ AI连接测试失败:', error.message)
      return false
    }
  }
}

module.exports = AIProcessor
