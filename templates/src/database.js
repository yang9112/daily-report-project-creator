#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
// eslint-disable-next-line no-unused-vars
const path = require('path')

class Database {
  constructor (config) {
    if (!config || !config.database) {
      throw new Error('配置无���：缺少database配置')
    }
    this.dbPath = config.database.path
    this.db = null
  }

  async init () {
    await this.connect()
  }

  async connect () {
    // Always close existing connection before creating a new one
    if (this.db) {
      await new Promise((resolve) => {
        this.db.close(() => resolve())
      })
      this.db = null
    }
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err)
        } else {
          this.initTables().then(resolve).catch(reject)
        }
      })
    })
  }

  async initTables () {
    return new Promise((resolve, reject) => {
      const createSourcesTable = `
        CREATE TABLE IF NOT EXISTS sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          feed_url TEXT NOT NULL UNIQUE,
          last_checked DATETIME,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `

      const createArticlesTable = `
        CREATE TABLE IF NOT EXISTS articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          link TEXT NOT NULL UNIQUE,
          published_at DATETIME,
          raw_content TEXT,
          summary TEXT,
          status TEXT DEFAULT 'new',
          featured INTEGER DEFAULT 0,
          sent INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          processed_at DATETIME,
          sent_at DATETIME,
          keywords TEXT,
          relevance_score INTEGER DEFAULT 0,
          FOREIGN KEY (source_id) REFERENCES sources (id)
        )
      `

      const createReportsTable = `
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL UNIQUE,
          total_articles INTEGER,
          featured_articles INTEGER,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `

      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles (source_id)',
        'CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status)',
        'CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles (featured)',
        'CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at)',
        'CREATE INDEX IF NOT EXISTS idx_articles_link ON articles (link)',
        'CREATE INDEX IF NOT EXISTS idx_sources_is_active ON sources (is_active)'
      ]

      this.db.serialize(() => {
        this.db.run(createSourcesTable)
        this.db.run(createArticlesTable)
        this.db.run(createReportsTable)

        createIndexes.forEach(indexSql => {
          this.db.run(indexSql)
        })

        console.log('✅ 数据库表初始化完成')
        resolve()
      })
    })
  }

  async addSource (name, feedUrl, isActive = true) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO sources (name, feed_url, is_active)
        VALUES (?, ?, ?)
      `
      this.db.run(sql, [name, feedUrl, isActive ? 1 : 0], function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  async getActiveSources () {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, name, feed_url, last_checked 
        FROM sources 
        WHERE is_active = 1
      `
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async updateSourceLastCheck (sourceId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE sources 
        SET last_checked = CURRENT_TIMESTAMP 
        WHERE id = ?
      `
      this.db.run(sql, [sourceId], function (err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async articleExists (link) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM articles WHERE link = ?'
      this.db.get(sql, [link], (err, row) => {
        if (err) reject(err)
        else resolve(!!row)
      })
    })
  }

  async getArticleById (articleId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM articles WHERE id = ?'
      this.db.get(sql, [articleId], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  async getUnprocessedArticles () {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.id, a.title, a.summary, a.keywords, a.link, a.published_at,
          s.name as source_name
        FROM articles a
        JOIN sources s ON a.source_id = s.id
        WHERE a.status = 'new'
        ORDER BY a.published_at DESC
      `
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getUnsentProcessedArticles (limit = 20) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.id, a.title, a.summary, a.keywords, a.link, a.published_at,
          s.name as source_name
        FROM articles a
        JOIN sources s ON a.source_id = s.id
        WHERE a.status = 'processed' 
        AND (sent_at IS NULL OR sent_at = '')
        ORDER BY a.published_at DESC
        LIMIT ?
      `
      this.db.all(sql, [limit], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async insertArticle (sourceId, title, link, publishedAt, rawContent) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO articles 
        (source_id, title, link, published_at, raw_content, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      this.db.run(sql, [sourceId, title, link, publishedAt, rawContent, 'new'], function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  async updateArticleSummary (articleId, summary, keywords) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE articles 
        SET summary = ?, keywords = ?, status = 'processed', processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.db.run(sql, [summary, keywords, articleId], function (err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async getUnsentArticles () {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.id, a.title, a.summary, a.keywords, a.link, a.published_at,
          s.name as source_name
        FROM articles a
        JOIN sources s ON a.source_id = s.id
        WHERE a.status = 'processed' AND (sent_at IS NULL OR sent_at = '')
        ORDER BY a.published_at DESC
      `
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getAllProcessedArticles () {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.id, a.title, a.summary, a.keywords, a.link, a.published_at, a.sent_at,
          s.name as source_name
        FROM articles a
        JOIN sources s ON a.source_id = s.id
        WHERE a.status = 'processed'
        ORDER BY a.published_at DESC
      `
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getSourceStats () {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          s.id,
          s.name,
          s.feed_url,
          s.last_checked,
          s.is_active,
          COUNT(a.id) as article_count,
          SUM(CASE WHEN a.status = 'processed' THEN 1 ELSE 0 END) as processed_count
        FROM sources s
        LEFT JOIN articles a ON s.id = a.source_id
        GROUP BY s.id, s.name, s.feed_url, s.last_checked, s.is_active
        ORDER BY s.name
      `
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  getDatabaseSize () {
    try {
      const stats = require('fs').statSync(this.dbPath)
      return {
        path: this.dbPath,
        sizeBytes: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2)
      }
    } catch (error) {
      return {
        path: this.dbPath,
        sizeBytes: 0,
        sizeMB: '0.00'
      }
    }
  }

  async getStatistics (days = 30) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_articles,
          COUNT(CASE WHEN articles.status = 'processed' THEN 1 END) as processed_articles,
          COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_articles,
          COUNT(DISTINCT source_id) as unique_sources,
          COUNT(DISTINCT DATE(published_at)) as active_days
        FROM articles 
        WHERE published_at >= datetime('now', '-${days} days')
      `
      this.db.get(sql, [], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  async getFeaturedArticles (startDate, endDate, limit = 20) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.id, a.title, a.summary, a.keywords, a.link, a.published_at,
          s.name as source_name, a.featured, 
          CASE 
            WHEN LENGTH(a.summary) > 200 THEN 8
            WHEN LENGTH(a.summary) > 100 THEN 6
            ELSE 4
          END as relevance_score
        FROM articles a
        JOIN sources s ON a.source_id = s.id
        WHERE a.status = 'processed' 
        AND a.published_at >= ? 
        AND a.published_at <= ?
        ORDER BY relevance_score DESC, a.published_at DESC
        LIMIT ?
      `
      this.db.all(sql, [startDate, endDate, limit], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async saveArticles (articles) {
    let savedCount = 0
    for (const article of articles) {
      try {
        if (!(await this.articleExists(article.link))) {
          const sourceId = await this.getSourceIdByName(article.source_name || article.source)
          if (sourceId) {
            await this.insertArticle(
              sourceId,
              article.title,
              article.link,
              article.published_at,
              article.content || article.raw_content
            )
            savedCount++
          }
        }
      } catch (error) {
        console.error(`保存文章失败: ${article.title}`, error.message)
      }
    }
    return savedCount
  }

  async getSourceIdByName (sourceName) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id FROM sources WHERE name = ?'
      this.db.get(sql, [sourceName], (err, row) => {
        if (err) reject(err)
        else resolve(row ? row.id : null)
      })
    })
  }

  async markArticleProcessed (articleId, processedData) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE articles 
        SET summary = ?, 
            keywords = ?, 
            status = 'processed',
            processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      this.db.run(sql, [
        processedData.summary || '',
        Array.isArray(processedData.keywords) ? processedData.keywords.join(',') : (processedData.keywords || ''),
        articleId
      ], function (err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async saveReport (reportData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO reports 
        (date, total_articles, featured_articles, generated_at)
        VALUES (?, ?, ?, ?)
      `
      this.db.run(sql, [
        reportData.date,
        reportData.totalArticles,
        reportData.featuredArticles,
        reportData.generatedAt
      ], function (err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async cleanupOldData (daysToKeep = 90) {
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM articles 
        WHERE published_at < datetime('now', '-${daysToKeep} days')
        AND status = 'sent'
      `
      this.db.run(sql, [], function (err) {
        if (err) reject(err)
        else resolve(this.changes)
      })
    })
  }

  async query (sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sql.trim().toLowerCase().startsWith('select')) {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      } else {
        this.db.run(sql, params, function (err) {
          if (err) reject(err)
          else resolve([])
        })
      }
    })
  }

  close () {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

module.exports = Database
