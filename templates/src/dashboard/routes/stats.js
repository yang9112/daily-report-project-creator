/**
 * 统计概览 API 路由
 * 返回: 文章总数、处理数、精选数、源数量
 * 支持时间范围参数
 */

const express = require('express')

module.exports = (db) => {
  const router = express.Router()

  /**
   * GET /api/stats
   * 获取统计概览数据
   * Query params:
   *   - days: 统计天数 (默认7)
   */
  router.get('/', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7
      const stats = await db.getStatistics(days)
      const sourceStats = await db.getSourceStats()

      res.json({
        success: true,
        data: {
          ...stats,
          sources: sourceStats
        },
        period: {
          days,
          from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('❌ 获取统计数据失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/stats/trend
   * 获取统计趋势数据
   */
  router.get('/trend', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7
      const trend = await db.getStatisticsTrend(days)

      res.json({
        success: true,
        data: trend
      })
    } catch (error) {
      console.error('❌ 获取统计趋势失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  return router
}