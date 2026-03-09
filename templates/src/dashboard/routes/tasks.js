/**
 * 任务状态 API 路由
 * 采集任务状态
 * 处理任务状态
 * 生成任务状态
 */

const express = require('express')

module.exports = (db) => {
  const router = express.Router()

  /**
   * GET /api/tasks
   * 获取所有任务状态
   */
  router.get('/', async (req, res) => {
    try {
      const stats = await db.getStatistics(1)
      const sourceStats = await db.getSourceStats()

      // 采集任务状态
      const collectionStatus = {
        totalSources: sourceStats.total,
        activeSources: sourceStats.active,
        lastCollection: sourceStats.lastCollection,
        successRate: sourceStats.total > 0
          ? ((sourceStats.active / sourceStats.total) * 100).toFixed(1)
          : 0
      }

      // 处理任务状态
      const processingStatus = {
        totalArticles: stats.totalArticles || 0,
        processedArticles: stats.processedArticles || 0,
        featuredArticles: stats.featuredArticles || 0,
        processingRate: stats.totalArticles > 0
          ? ((stats.processedArticles / stats.totalArticles) * 100).toFixed(1)
          : 0
      }

      // 生成任务状态
      const generationStatus = {
        totalReports: stats.totalReports || 0,
        lastGeneration: stats.lastReportDate || null,
        articlesPerReport: stats.totalReports > 0
          ? Math.round(stats.totalArticles / stats.totalReports)
          : 0
      }

      res.json({
        success: true,
        data: {
          collection: collectionStatus,
          processing: processingStatus,
          generation: generationStatus,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('❌ 获取任务状态失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/tasks/collection
   * 获取采集任务详情
   */
  router.get('/collection', async (req, res) => {
    try {
      const sourceStats = await db.getSourceStats()
      const articles = await db.getRecentArticles(10)

      res.json({
        success: true,
        data: {
          sources: sourceStats.sources || [],
          recentArticles: articles,
          summary: {
            total: sourceStats.total,
            active: sourceStats.active,
            lastCollection: sourceStats.lastCollection
          }
        }
      })
    } catch (error) {
      console.error('❌ 获取采集任务详情失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/tasks/processing
   * 获取处理任务详情
   */
  router.get('/processing', async (req, res) => {
    try {
      const stats = await db.getStatistics(7)
      const unprocessed = await db.getUnprocessedArticles(10)

      res.json({
        success: true,
        data: {
          summary: {
            total: stats.totalArticles || 0,
            processed: stats.processedArticles || 0,
            featured: stats.featuredArticles || 0,
            pending: (stats.totalArticles || 0) - (stats.processedArticles || 0)
          },
          unprocessedArticles: unprocessed
        }
      })
    } catch (error) {
      console.error('❌ 获取处理任务详情失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/tasks/generation
   * 获取生成任务详情
   */
  router.get('/generation', async (req, res) => {
    try {
      const stats = await db.getStatistics(30)
      const recentReports = await db.getReports(1, 10)

      res.json({
        success: true,
        data: {
          summary: {
            total: stats.totalReports || 0,
            lastGeneration: stats.lastReportDate,
            avgArticlesPerReport: stats.totalReports > 0
              ? Math.round(stats.totalArticles / stats.totalReports)
              : 0
          },
          recentReports
        }
      })
    } catch (error) {
      console.error('❌ 获取生成任务详情失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  return router
}