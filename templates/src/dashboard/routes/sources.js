/**
 * RSS源状态 API 路由
 * 各源采集统计
 * 活跃状态
 */

const express = require('express')

module.exports = (db) => {
  const router = express.Router()

  /**
   * GET /api/sources
   * 获取所有RSS源状态
   */
  router.get('/', async (req, res) => {
    try {
      const sources = await db.getSources()
      const sourceStats = await db.getSourceStats()

      res.json({
        success: true,
        data: {
          sources,
          summary: {
            total: sourceStats.total,
            active: sourceStats.active,
            inactive: sourceStats.total - sourceStats.active
          }
        }
      })
    } catch (error) {
      console.error('❌ 获取源列表失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/sources/:id
   * 获取单个源详情
   */
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params
      const source = await db.getSourceById(id)

      if (!source) {
        return res.status(404).json({
          success: false,
          error: '源不存在'
        })
      }

      // 获取该源的统计信息
      const articles = await db.getArticlesBySource(id)

      res.json({
        success: true,
        data: {
          ...source,
          statistics: {
            totalArticles: articles.length,
            processedArticles: articles.filter(a => a.is_processed).length,
            featuredArticles: articles.filter(a => a.is_featured).length
          }
        }
      })
    } catch (error) {
      console.error('❌ 获取源详情失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/sources/:id/stats
   * 获取源统计信息
   */
  router.get('/:id/stats', async (req, res) => {
    try {
      const { id } = req.params
      const days = parseInt(req.query.days) || 7

      const source = await db.getSourceById(id)
      if (!source) {
        return res.status(404).json({
          success: false,
          error: '源不存在'
        })
      }

      const articles = await db.getArticlesBySource(id)
      const recentArticles = articles.filter(a => {
        const pubDate = new Date(a.pub_date)
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        return pubDate >= cutoff
      })

      res.json({
        success: true,
        data: {
          source,
          statistics: {
            totalArticles: articles.length,
            recentArticles: recentArticles.length,
            processedArticles: recentArticles.filter(a => a.is_processed).length,
            featuredArticles: recentArticles.filter(a => a.is_featured).length
          },
          period: { days }
        }
      })
    } catch (error) {
      console.error('❌ 获取源统计失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  return router
}
