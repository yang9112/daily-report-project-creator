#!/usr/bin/env node

/**
 * Dashboard Web 服务器
 * 提供任务状态展示和报告浏览功能
 */

const express = require('express')
const path = require('path')

class DashboardServer {
  constructor (config, database) {
    this.config = config
    this.db = database
    this.app = null
    this.server = null
    this.port = config.dashboard?.port || 3456
  }

  /**
   * 初始化 Express 应用
   */
  init () {
    this.app = express()

    // 中间件
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))

    // 静态文件
    this.app.use(express.static(path.join(__dirname, 'public')))

    // 视图引擎
    this.app.set('view engine', 'ejs')
    this.app.set('views', path.join(__dirname, 'views'))

    // 路由
    this.setupRoutes()

    // 错误处理
    this.app.use((err, req, res, next) => {
      console.error('❌ Dashboard错误:', err.message)
      res.status(500).json({ error: err.message })
    })
  }

  /**
   * 设置路由
   */
  setupRoutes () {
    // API 路由
    const statsRouter = require('./routes/stats')(this.db)
    const reportsRouter = require('./routes/reports')(this.db)
    const tasksRouter = require('./routes/tasks')(this.db)
    const sourcesRouter = require('./routes/sources')(this.db)

    this.app.use('/api/stats', statsRouter)
    this.app.use('/api/reports', reportsRouter)
    this.app.use('/api/tasks', tasksRouter)
    this.app.use('/api/sources', sourcesRouter)

    // 页面路由
    this.app.get('/', this.renderOverview.bind(this))
    this.app.get('/reports', this.renderReports.bind(this))
    this.app.get('/reports/:id', this.renderReportDetail.bind(this))
    this.app.get('/sources', this.renderSources.bind(this))
  }

  /**
   * 渲染概览页
   */
  async renderOverview (req, res) {
    try {
      const period = parseInt(req.query.period) || 7
      const stats = await this.db.getStatistics(period)
      const recentReports = await this.db.getReports(1, 5)
      const sourceStats = await this.db.getSourceStats()
      const trend = await this.db.getStatisticsTrend(period)

      res.render('overview', {
        stats,
        recentReports,
        sourceStats,
        trend,
        period,
        title: '技术日报控制台'
      })
    } catch (error) {
      res.render('error', { error: error.message, title: '错误' })
    }
  }

  /**
   * 渲染报告列表页
   */
  async renderReports (req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const reports = await this.db.getReports(page, limit)

      res.render('reports', {
        reports,
        page,
        limit,
        title: '日报列表'
      })
    } catch (error) {
      res.render('error', { error: error.message, title: '错误' })
    }
  }

  /**
   * 渲染报告详情页
   */
  async renderReportDetail (req, res) {
    try {
      const { id } = req.params
      const report = await this.db.getReportById(id)

      if (!report) {
        return res.status(404).render('error', { error: '报告不存在', title: '404' })
      }

      res.render('report-detail', {
        report,
        title: `日报 - ${report.report_date}`
      })
    } catch (error) {
      res.render('error', { error: error.message, title: '错误' })
    }
  }

  /**
   * 渲染RSS源管理页
   */
  async renderSources (req, res) {
    try {
      const sources = await this.db.getSources()

      res.render('sources', {
        sources,
        title: 'RSS源管理'
      })
    } catch (error) {
      res.render('error', { error: error.message, title: '错误' })
    }
  }

  /**
   * 启动服务器
   */
  async start () {
    return new Promise((resolve, reject) => {
      try {
        this.init()

        this.server = this.app.listen(this.port, () => {
          console.log(`✅ Dashboard服务已启动: http://localhost:${this.port}`)
          resolve(this.port)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 停止服务器
   */
  async stop () {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Dashboard服务已停止')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

module.exports = DashboardServer
