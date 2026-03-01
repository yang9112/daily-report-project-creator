#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * SQLite数据库操作类
 * 负责数据持久化和查询
 */
class DatabaseManager {
  constructor(config = {}) {
    this.dbPath = config.dbPath || './data/daily-report.db';
    this.dataDir = config.dataDir || './data';
    
    // 确保数据目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(this.dbPath);
    this.initDatabase();
  }

  /**
   * 初始化数据库表结构
   */
  initDatabase() {
    console.log('🔧 初始化数据库...');
    
    // 创建sources表
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          url TEXT UNIQUE NOT NULL,
          category TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建articles表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guid TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          link TEXT UNIQUE NOT NULL,
          description TEXT,
          content TEXT,
          summary TEXT,
          source_name TEXT NOT NULL,
          category TEXT,
          author TEXT,
          pub_date DATETIME NOT NULL,
          collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          processed_at DATETIME,
          keywords TEXT,
          sentiment TEXT,
          relevance_score INTEGER DEFAULT 5,
          is_processed BOOLEAN DEFAULT 0,
          is_featured BOOLEAN DEFAULT 0,
          FOREIGN KEY (source_name) REFERENCES sources (name)
        )
      `);

      // 创建reports表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          report_date DATE UNIQUE NOT NULL,
          file_path TEXT,
          total_articles INTEGER DEFAULT 0,
          featured_articles INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          generated_at DATETIME
        )
      `);

      // 创建索引
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_name)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_articles_relevance ON articles(relevance_score)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_articles_processed ON articles(is_processed)`);
      
      console.log('✅ 数据库初始化完成');
    });
  }

  /**
   * 添加RSS源
   */
  async addSource(source) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO sources (name, url, category, is_active)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([source.name, source.url, source.category || 'general', source.isActive !== false], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ 添加源: ${source.name}`);
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  /**
   * 获取所有活��的RSS源
   */
  async getActiveSources() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM sources WHERE is_active = 1 ORDER BY name',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * 保存文章
   */
  async saveArticle(article) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO articles (
          guid, title, link, description, content, source_name, 
          category, author, pub_date, collected_at, keywords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        article.guid || article.link,
        article.title,
        article.link,
        article.description || '',
        article.content || '',
        article.source,
        article.category || 'general',
        article.author || '',
        article.pubDate || new Date(),
        article.collectedAt || new Date(),
        JSON.stringify(article.keywords || [])
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  /**
   * 批量保存文章
   */
  async saveArticles(articles) {
    console.log(`💾 批量保存 ${articles.length} 篇文章...`);
    
    for (const article of articles) {
      try {
        await this.saveArticle(article);
      } catch (error) {
        console.error(`❌ 保存文章失败: ${article.title}`, error.message);
      }
    }
    
    console.log(`✅ 批量保存完成`);
  }

  /**
   * 标记文章为已处理
   */
  async markArticleProcessed(articleId, processedData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE articles SET 
          is_processed = 1,
          processed_at = CURRENT_TIMESTAMP,
          summary = ?,
          sentiment = ?,
          relevance_score = ?,
          is_featured = ?
        WHERE id = ?
      `);
      
      stmt.run([
        processedData.summary,
        processedData.sentiment || '中性',
        processedData.relevanceScore || 5,
        processedData.relevanceScore >= 8 ? 1 : 0,
        articleId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
      
      stmt.finalize();
    });
  }

  /**
   * 获取未处理的文章
   */
  async getUnprocessedArticles(limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM articles 
         WHERE is_processed = 0 
         ORDER BY pub_date DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // 解析JSON字段
            rows.forEach(row => {
              try {
                row.keywords = JSON.parse(row.keywords);
              } catch (e) {
                row.keywords = [];
              }
            });
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * 获取指定日期范围的精选文章
   */
  async getFeaturedArticles(startDate, endDate, limit = 20) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM articles 
         WHERE is_featured = 1 
         AND processed_at IS NOT NULL
         AND pub_date BETWEEN ? AND ?
         ORDER BY relevance_score DESC, pub_date DESC 
         LIMIT ?`,
        [startDate, endDate, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // 解析JSON字段
            rows.forEach(row => {
              try {
                row.keywords = JSON.parse(row.keywords);
              } catch (e) {
                row.keywords = [];
              }
            });
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * 保存报告记录
   */
  async saveReport(reportData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO reports (
          report_date, file_path, total_articles, featured_articles, generated_at
        ) VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        reportData.date,
        reportData.filePath,
        reportData.totalArticles,
        reportData.featuredArticles,
        reportData.generatedAt || new Date()
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  /**
   * 获取统计信息
   */
  async getStatistics(days = 30) {
    return new Promise((resolve, reject) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      this.db.all(
        `SELECT 
           COUNT(*) as total_articles,
           COUNT(CASE WHEN is_processed = 1 THEN 1 END) as processed_articles,
           COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_articles,
           COUNT(DISTINCT source_name) as unique_sources,
           COUNT(DISTINCT DATE(pub_date)) as active_days
         FROM articles 
         WHERE pub_date >= ?`,
        [startDate.toISOString()],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows[0]);
          }
        }
      );
    });
  }

  /**
   * 获取源统计
   */
  async getSourceStats() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
           s.name,
           s.url,
           s.category,
           COUNT(a.id) as article_count,
           COUNT(CASE WHEN a.is_processed = 1 THEN 1 END) as processed_count,
           MAX(a.pub_date) as latest_article
         FROM sources s
         LEFT JOIN articles a ON s.name = a.source_name
         WHERE s.is_active = 1
         GROUP BY s.id
         ORDER BY article_count DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData(daysToKeep = 90) {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      this.db.run(
        'DELETE FROM articles WHERE pub_date < ? AND is_featured = 0',
        [cutoffDate.toISOString()],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`🧹 清理了 ${this.changes} 条旧文章记录`);
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * 备份数据库
   */
  async backup(backupPath) {
    return new Promise((resolve, reject) => {
      const backup = this.db.backup(backupPath);
      
      backup.step(-1, (err) => {
        if (err) {
          reject(err);
        } else {
          backup.finish((err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`💾 数据库备份完成: ${backupPath}`);
              resolve(backupPath);
            }
          });
        }
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('关闭数据库失败:', err.message);
        } else {
          console.log('🔒 数据库连接已关闭');
        }
      });
    }
  }

  /**
   * 执行原始查询
   */
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 获取数据库大小
   */
  getDatabaseSize() {
    try {
      const stats = fs.statSync(this.dbPath);
      return {
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      return { size: 0, sizeMB: '0.00' };
    }
  }
}

module.exports = DatabaseManager;