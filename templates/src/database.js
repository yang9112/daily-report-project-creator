const BetterSqlite3 = require('better-sqlite3')
// eslint-disable-next-line no-unused-vars
const path = require('path')

class Database {
  constructor (config) {
    if (!config || !config.database) {
      throw new Error('配置无效：缺少database配置')
    }
    this.dbPath = config.database.path
    this.db = null
  }

  async init () {
    await this.connect()
  }

  async connect () {
    this.db = new BetterSqlite3(this.dbPath)
    await this.initTables()
  }

  async initTables () {
    try {
      // 创建sources表
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

      // 创建articles表
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
                    FOREIGN KEY (source_id) REFERENCES sources (id)
                )
            `

      // 创建索引
      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles (source_id)',
        'CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status)',
        'CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles (featured)',
        'CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at)',
        'CREATE INDEX IF NOT EXISTS idx_articles_link ON articles (link)',
        'CREATE INDEX IF NOT EXISTS idx_sources_is_active ON sources (is_active)'
      ]

      this.db.exec(createSourcesTable)
      this.db.exec(createArticlesTable)

      createIndexes.forEach(indexSql => {
        this.db.exec(indexSql)
      })

      console.log('✅ 数据库表初始化完成')
    } catch (error) {
      console.error('❌ 数据库表初始化失败:', error.message)
      throw error
    }
  }

  async addSource (name, feedUrl, isActive = true) {
    const sql = `
            INSERT OR REPLACE INTO sources (name, feed_url, is_active)
            VALUES (?, ?, ?)
        `

    const stmt = this.db.prepare(sql)
    const result = stmt.run(name, feedUrl, isActive ? 1 : 0)
    return result.lastInsertRowid
  }

  async getActiveSources () {
    const sql = `
            SELECT id, name, feed_url, last_checked 
            FROM sources 
            WHERE is_active = 1
        `

    const stmt = this.db.prepare(sql)
    return stmt.all()
  }

  async updateSourceLastCheck (sourceId) {
    const sql = `
            UPDATE sources 
            SET last_checked = CURRENT_TIMESTAMP 
            WHERE id = ?
        `

    const stmt = this.db.prepare(sql)
    stmt.run(sourceId)
  }

  async addArticle (article) {
    const sql = `
            INSERT OR REPLACE INTO articles 
            (id, title, summary, keywords, link, published_at, source_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `

    const stmt = this.db.prepare(sql)
    const result = stmt.run(
      article.id,
      article.title,
      article.summary,
      article.keywords,
      article.link,
      article.published_at,
      article.source_id,
      article.status || 'new'
    )
    return result.lastInsertRowid
  }

  async updateArticleStatus (articleId, status) {
    const sql = `
            UPDATE articles 
            SET status = ? 
            WHERE id = ?
        `

    const stmt = this.db.prepare(sql)
    stmt.run(status, articleId)
  }

  // 检查文章是否已存在（基于链接）
  async articleExists (link) {
    const sql = 'SELECT id FROM articles WHERE link = ?'
    const stmt = this.db.prepare(sql)
    const result = stmt.get(link)
    return !!result
  }

  // 检查文章是否已存在（基于ID）
  async getArticleById (articleId) {
    const sql = 'SELECT * FROM articles WHERE id = ?'
    const stmt = this.db.prepare(sql)
    return stmt.get(articleId)
  }

  async getUnprocessedArticles () {
    const sql = `
            SELECT 
                a.id, a.title, a.summary, a.keywords, a.link, a.published_at,
                s.name as source_name
            FROM articles a
            JOIN sources s ON a.source_id = s.id
            WHERE a.status = 'new'
            ORDER BY a.published_at DESC
        `

    const stmt = this.db.prepare(sql)
    return stmt.all()
  }

  async getUnsentProcessedArticles (limit = 20) {
    const sql = `
            SELECT 
                a.id, a.title, a.summary, a.keywords, a.link, a.published_at,
                s.name as source_name
            FROM articles a
            JOIN sources s ON a.source_id = s.id
            WHERE a.status = 'processed' 
            AND a.sent_at IS NULL
            ORDER BY a.published_at DESC
            LIMIT ?
        `

    const stmt = this.db.prepare(sql)
    return stmt.all(limit)
  }

  async getStatistics (limit = 30) {
    // Simplified statistics to match expected structure
    const sql = `
            SELECT 
                COUNT(*) as total_articles,
                COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_articles,
                COUNT(CASE WHEN status = 'processed' AND LENGTH(summary) > 100 THEN 1 END) as featured_articles,
                COUNT(DISTINCT source_id) as unique_sources,
                COUNT(DISTINCT DATE(published_at)) as active_days
            FROM articles 
            WHERE published_at >= datetime('now', '-${limit} days')
        `

    const stmt = this.db.prepare(sql)
    return stmt.get()
  }

  close () {
    if (this.db) {
      this.db.close()
    }
  }

  // 检查文章是否已发送过
  async isArticleSent (articleId) {
    const sql = 'SELECT sent_at FROM articles WHERE id = ? AND sent_at IS NOT NULL'
    const stmt = this.db.prepare(sql)
    const result = stmt.get(articleId)
    return !!result
  }

  // 标记文章为已发送
  async markArticleSent (articleId) {
    const sql = 'UPDATE articles SET sent_at = CURRENT_TIMESTAMP WHERE id = ?'
    const stmt = this.db.prepare(sql)
    stmt.run(articleId)
  }

  // 插入文章的简化方法
  async insertArticle (sourceId, title, link, publishedAt, rawContent) {
    // 修复：不传递id字段，让数据库自动生成INTEGER PRIMARY KEY
    const sql = `
            INSERT OR REPLACE INTO articles 
            (source_id, title, link, published_at, raw_content, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `

    const stmt = this.db.prepare(sql)
    const result = stmt.run(
      sourceId,
      title,
      link,
      publishedAt,
      rawContent,
      'new'
    )

    return result.lastInsertRowid
  }

  // 更新文章摘要
  async updateArticleSummary (articleId, summary, keywords) {
    const sql = `
            UPDATE articles 
            SET summary = ?, keywords = ?, status = 'processed' 
            WHERE id = ?
        `

    const stmt = this.db.prepare(sql)
    stmt.run(summary, keywords, articleId)
  }

  // 获取未发送的文章
  async getUnsentArticles () {
    const sql = `
            SELECT 
                a.id, a.title, a.summary, a.keywords, a.link, a.published_at,
                s.name as source_name
            FROM articles a
            JOIN sources s ON a.source_id = s.id
            WHERE a.status = 'processed' AND (a.sent_at IS NULL OR a.sent_at = '')
            ORDER BY a.published_at DESC
        `

    const stmt = this.db.prepare(sql)
    return stmt.all()
  }

  // 获取所有已处理的文章（包括已发送的）
  async getAllProcessedArticles () {
    const sql = `
            SELECT 
                a.id, a.title, a.summary, a.keywords, a.link, a.published_at, a.sent_at,
                s.name as source_name
            FROM articles a
            JOIN sources s ON a.source_id = s.id
            WHERE a.status = 'processed'
            ORDER BY a.published_at DESC
        `

    const stmt = this.db.prepare(sql)
    return stmt.all()
  }

  // 获取源统计信息
  async getSourceStats () {
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

    const stmt = this.db.prepare(sql)
    return stmt.all()
  }

  // 获取数据库大小
  getDatabaseSize () {
    try {
      const stats = this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get()
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
      return { sizeBytes: stats.size, sizeMB: parseFloat(sizeMB) }
    } catch (error) {
      return { sizeBytes: 0, sizeMB: 0 }
    }
  }
}

module.exports = Database
