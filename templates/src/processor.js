#!/usr/bin/env node

const Database = require('./database')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

/**
 * AI摘要处理器
 */
class Processor {
  constructor () {
    this.db = new Database()
    this.openai = null
    this.loadConfig()
  }

  /**
   * 加载配置
   */
  loadConfig () {
    const configPath = path.join(__dirname, '../config/config.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      
      if (config.llm && config.llm.api_key) {
        this.openai = new OpenAI({
          apiKey: config.llm.api_key,
          baseURL: config.llm.base_url
        })
      }
    }
  }

  /**
   * 处理所有待处理文章
   */
  async processPending () {
    if (!this.openai) {
      throw new Error('❌ 未配置AI服务，请检查config.json')
    }

    await this.db.connect()

    try {
      // 获取所有待处理文章
      const articles = await this.db.all(
        'SELECT * FROM articles WHERE status = "pending" ORDER BY published_at DESC LIMIT 20'
      )

      let processedCount = 0

      for (const article of articles) {
        try {
          const summary = await this.generateSummary(article)
          
          // 更新文章状态和摘要
          await this.db.run(
            'UPDATE articles SET summary = ?, status = "processed" WHERE id = ?',
            [summary, article.id]
          )

          processedCount++
          console.log(`✅ 已处理: ${article.title}`)
          
          // 避免API限速
          await this.sleep(1000)
        } catch (error) {
          console.error(`❌ 处理失败 [${article.title}]: ${error.message}`)
          
          // 标记为失败状态
          await this.db.run(
            'UPDATE articles SET status = "failed" WHERE id = ?',
            [article.id]
          )
        }
      }

      return processedCount
    } finally {
      this.db.close()
    }
  }

  /**
   * 生成文章AI摘要
   */
  async generateSummary (article) {
    const content = article.raw_content || article.title
    
    if (!content || content.trim().length < 50) {
      return '内容过短无法生成摘要'
    }

    const prompt = `请为以下技术博客文章生成简洁的中文摘要（150字以内），突出核心观点和技术要点：

标题：${article.title}

内容：${content.substring(0, 1000)}

摘要：`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个技术博客摘要专家，擅长提炼技术文章的核心观点和要点。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })

      return response.choices[0].message.content.trim()
    } catch (error) {
      console.error('AI摘要生成失败:', error.message)
      throw new Error('AI服务调用失败')
    }
  }

  /**
   * 延时函数
   */
  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const processor = new Processor()
  
  processor.processPending()
    .then(count => {
      console.log(`✅ 处理完成，成功处理 ${count} 篇文章`)
    })
    .catch(error => {
      console.error('❌ 处理失败:', error.message)
      process.exit(1)
    })
}

module.exports = Processor