#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

/**
 * 数据库管理类
 */
class Database {
  constructor (dbPath = './data/tech_daily.db') {
    this.dbPath = dbPath
    this.db = null
  }

  /**
   * 连接数据库
   */
  connect () {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 初始化数据库表
   */
  async init () {
    await this.connect()

    // 创建sources表
    await this.run(`
      CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        feed_url TEXT NOT NULL UNIQUE,
        last_checked DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建articles表
    await this.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER,
        title TEXT NOT NULL,
        link TEXT NOT NULL UNIQUE,
        published_at DATETIME,
        raw_content TEXT,
        summary TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES sources (id)
      )
    `)

    // 创建reports表
    await this.run(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        articles_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建索引
    await this.run('CREATE INDEX IF NOT EXISTS idx_articles_link ON articles(link)')
    await this.run('CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)')
    await this.run('CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at)')

    console.log('✅ 数据库初始化完成')
  }

  /**
   * 执行SQL语句
   */
  run (sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(this)
        }
      })
    })
  }

  /**
   * 查询SQL语句
   */
  all (sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  /**
   * 插入数据
   */
  insert (table, data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    return this.run(sql, values)
  }

  /**
   * 关闭数据库连接
   */
  close () {
    if (this.db) {
      this.db.close()
    }
  }
}

// 如果直接运行此文件，初始化数据库
if (require.main === module) {
  const db = new Database()
  db.init()
    .then(() => {
      console.log('数据库初始化成功')
      db.close()
    })
    .catch(err => {
      console.error('数据库初始化失败:', err)
      process.exit(1)
    })
}

module.exports = Database