#!/usr/bin/env node

const axios = require('axios')
const FeedParser = require('feedparser')
const Database = require('./database')
const fs = require('fs')
const path = require('path')

/**
 * RSS文章采集器
 */
class Collector {
  constructor () {
    this.db = new Database()
  }

  /**
   * 采集所有活跃RSS源
   */
  async collectAll () {
    await this.db.connect()
    
    let totalCollected = 0
    
    try {
      // 获取所有活跃RSS源
      const sources = await this.db.all('SELECT * FROM sources WHERE is_active = 1')
      
      for (const source of sources) {
        try {
          const count = await this.collectFromSource(source)
          totalCollected += count
          
          // 更新最后检查时间
          await this.db.run(
            'UPDATE sources SET last_checked = CURRENT_TIMESTAMP WHERE id = ?',
            [source.id]
          )
        } catch (error) {
          console.error(`❌ 采集失败 [${source.name}]: ${error.message}`)
        }
      }
    } finally {
      this.db.close()
    }

    return totalCollected
  }

  /**
   * 从单个RSS源采集文章
   */
  async collectFromSource (source) {
    return new Promise((resolve, reject) => {
      let collectedCount = 0
      const feedparser = new FeedParser()

      // 设置FeedParser事件监听
      feedparser.on('readable', function () {
        let item
        while ((item = this.read())) {
          // 处理单个文章项
          // 注意：这里需要在外部处理数据库操作
        }
      })

      feedparser.on('error', function (error) {
        reject(error)
      })

      feedparser.on('end', function () {
        resolve(collectedCount)
      })

      // 发起HTTP请求获取RSS
      axios.get(source.feed_url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Tech-Daily-Digest/1.0'
        }
      }).then(response => {
        if (response.status === 200) {
          feedparser.end(response.data)
        } else {
          reject(new Error(`HTTP ${response.status}: ${response.statusText}`))
        }
      }).catch(reject)
    })
  }

  /**
   * 保存文章到数据库（去��）
   */
  async saveArticle (article, sourceId) {
    try {
      // 检查文章是否已存在
      const existing = await this.db.all(
        'SELECT id FROM articles WHERE link = ?',
        [article.link]
      )

      if (existing.length === 0) {
        // 插入新文章
        await this.db.insert('articles', {
          source_id: sourceId,
          title: article.title,
          link: article.link,
          published_at: article.pubDate ? new Date(article.pubDate).toISOString() : null,
          raw_content: article.description || article.summary || '',
          status: 'pending'
        })
        return true
      }
      return false
    } catch (error) {
      console.error(`保存文章失败 [${article.title}]: ${error.message}`)
      return false
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const collector = new Collector()
  
  // 加载配置
  const configPath = path.join(__dirname, '../config/sources.json')
  if (!fs.existsSync(configPath)) {
    console.error('❌ 配置文件不存在:', configPath)
    process.exit(1)
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  
  // 首先确保数据库中��配��的RSS源
  const db = new Database()
  db.init().then(async () => {
    try {
      // 清空并重新插入RSS源
      await db.run('DELETE FROM sources')
      
      for (const source of config.sources) {
        await db.insert('sources', {
          name: source.name,
          feed_url: source.feed_url,
          is_active: source.is_active !== false
        })
      }

      // 开始采集
      const count = await collector.collectAll()
      console.log(`✅ 采集完成，新增 ${count} 篇文章`)
      
      db.close()
    } catch (error) {
      console.error('❌ 采集失败:', error.message)
      process.exit(1)
    }
  })
}

module.exports = Collector