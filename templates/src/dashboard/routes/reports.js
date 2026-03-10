/**
 * 报告列表 API 路由
 * 分页返回已生成的日报
 * 支持日期筛选
 */

const express = require('express')

module.exports = (db) => {
  const router = express.Router()

  /**
   * GET /api/reports
   * 获取报告列表
   * Query params:
   *   - page: 页码 (默认1)
   *   - limit: 每页数量 (默认20)
   *   - startDate: 开始日期 (可选)
   *   - endDate: 结束日期 (可选)
   */
  router.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20

      const { startDate, endDate } = req.query

      const reports = await db.getReports(page, limit, startDate, endDate)
      const total = await db.getReportsCount(startDate, endDate)

      res.json({
        success: true,
        data: reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('❌ 获取报告列表失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/reports/:id
   * 获取报告详情
   */
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params
      const report = await db.getReportById(id)

      if (!report) {
        return res.status(404).json({
          success: false,
          error: '报告不存在'
        })
      }

      res.json({
        success: true,
        data: report
      })
    } catch (error) {
      console.error('❌ 获取报告详情失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/reports/latest
   * 获取最新报告
   */
  router.get('/latest', async (req, res) => {
    try {
      const report = await db.getLatestReport()

      res.json({
        success: true,
        data: report
      })
    } catch (error) {
      console.error('❌ 获取最新报告失败:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  return router
}
