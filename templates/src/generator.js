#!/usr/bin/env node

const Database = require('./database')
const fs = require('fs')
const path = require('path')

/**
 * 日报生成器
 */
class Generator {
  constructor () {
    this.db = new Database()
    this.outputDir = './output'
    this.ensureOutputDir()
  }

  /**
   * 确保输出目录存在
   */
  ensureOutputDir () {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * 生成今日日报
   */
  async generateDigest () {
    await this.db.connect()

    try {
      // 获取最近24小时内已处理的文章
      const articles = await this.db.all(`
        SELECT a.title, a.summary, a.link, s.name as source_name, a.published_at
        FROM articles a
        JOIN sources s ON a.source_id = s.id
        WHERE a.status = 'processed' 
        AND a.created_at > datetime('now', '-1 day')
        ORDER BY a.published_at DESC
        LIMIT 20
      `)

      if (articles.length === 0) {
        console.log('⚠️ 没有找到可用的文章')
        return null
      }

      // 生成日报内容
      const digestContent = await this.generateDigestContent(articles)
      
      // 保存日报文件
      const filename = `tech-daily-${this.getDateString()}.md`
      const filepath = path.join(this.outputDir, filename)
      
      fs.writeFileSync(filepath, digestContent, 'utf8')

      // 保存到数据库
      await this.db.insert('reports', {
        title: `技术日报 - ${this.getDateString()}`,
        content: digestContent,
        articles_count: articles.length
      })

      console.log(`✅ 日报生成成功: ${filepath}`)
      return filepath
    } finally {
      this.db.close()
    }
  }

  /**
   * 生成日报内容
   */
  async generateDigestContent (articles) {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })

    let content = `# 技术日报 ${date}

> 共收录 ${articles.length} 篇优质技术文章

---

## 📰 今日要闻

`

    // 按来源分组文章
    const groupedArticles = this.groupArticlesBySource(articles)

    for (const [sourceName, sourceArticles] of Object.entries(groupedArticles)) {
      content += `### ${sourceName}\n\n`
      
      for (const article of sourceArticles) {
        content += `#### ${article.title}\n\n`
        content += `**要点：** ${article.summary}\n\n`
        content += `**链接：** [阅读原文](${article.link})\n\n`
        content += `**发布时间：** ${new Date(article.published_at).toLocaleString('zh-CN')}\n\n`
        content += `---\n\n`
      }
    }

    content += `
## 📊 统计信息

- **文章总数：** ${articles.length} 篇
- **来源数量：** ${Object.keys(groupedArticles).length} 个
- **生成时间：** ${new Date().toLocaleString('zh-CN')}

---

> 🤖 本日报由 AI 自动采集和摘要生成，供技术学习参考。

---

*Powered by Tech Daily Digest v1.0*`

    return content
  }

  /**
   * 按来源分组文章
   */
  groupArticlesBySource (articles) {
    const grouped = {}
    
    for (const article of articles) {
      if (!grouped[article.source_name]) {
        grouped[article.source_name] = []
      }
      grouped[article.source_name].push(article)
    }

    return grouped
  }

  /**
   * 获取日期字符串
   */
  getDateString () {
    const now = new Date()
    return now.toISOString().split('T')[0].replace(/-/g, '')
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const generator = new Generator()
  
  generator.generateDigest()
    .then(filepath => {
      if (filepath) {
        console.log('✅ 日报生成完成:', filepath)
      }
    })
    .catch(error => {
      console.error('❌ 日报生成失败:', error.message)
      process.exit(1)
    })
}

module.exports = Generator