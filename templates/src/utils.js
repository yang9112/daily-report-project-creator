#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

/**
 * 工具函数库
 */
class Utils {
  /**
   * 生成唯一ID
   */
  static generateId (prefix = '') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
  }

  /**
   * 生成哈希值
   */
  static generateHash (text, algorithm = 'md5') {
    return crypto.createHash(algorithm).update(text).digest('hex')
  }

  /**
   * 延迟执行
   */
  static delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 重试机制
   */
  static async retry (fn, maxAttempts = 3, delayMs = 1000) {
    let lastError

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        console.warn(`⚠️ 尝试 ${attempt}/${maxAttempts} 失败: ${error.message}`)

        if (attempt < maxAttempts) {
          await this.delay(delayMs * attempt) // 指数退避
        }
      }
    }

    throw lastError
  }

  /**
   * 格式化日期
   */
  static formatDate (date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  /**
   * 计算两个日期之间的天数差
   */
  static daysBetween (date1, date2) {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = Math.abs(d2 - d1)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * 获取今天开始的日期
   */
  static getStartOfDay (date = new Date()) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  /**
   * 获取今天结束的日期
   */
  static getEndOfDay (date = new Date()) {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  /**
   * 获取昨天的日期
   */
  static getYesterday () {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  }

  /**
   * 检查日期是否有效
   */
  static isValidDate (date) {
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * 清理文件名
   */
  static sanitizeFilename (filename) {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()
  }

  /**
   * 确保目录存在
   */
  static ensureDir (dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return dirPath
  }

  /**
   * 读取JSON文件
   */
  static readJsonFile (filePath, defaultValue = {}) {
    try {
      if (!fs.existsSync(filePath)) {
        return defaultValue
      }
      const content = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error(`❌ 读取JSON文件失败: ${filePath}`, error.message)
      return defaultValue
    }
  }

  /**
   * 写入JSON文件
   */
  static writeJsonFile (filePath, data, options = { spaces: 2 }) {
    try {
      this.ensureDir(path.dirname(filePath))
      const content = JSON.stringify(data, null, options.spaces)
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    } catch (error) {
      console.error(`❌ 写入JSON文件失败: ${filePath}`, error.message)
      return false
    }
  }

  /**
   * 获取文件大小（人类可读）
   */
  static formatFileSize (bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 截断文本
   */
  static truncateText (text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - suffix.length) + suffix
  }

  /**
   * 清理HTML标签
   */
  static stripHtml (html) {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  /**
   * 提取域名
   */
  static extractDomain (url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch (error) {
      return ''
    }
  }

  /**
   * 检查URL是否有效
   */
  static isValidUrl (url) {
    try {
      // eslint-disable-next-line no-new
      new URL(url)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 生成随机字符串
   */
  static randomString (length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 深度克隆对象
   */
  static deepClone (obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item))
    }

    const cloned = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }

    return cloned
  }

  /**
   * 合并对象
   */
  static mergeDeep (target, source) {
    const result = this.deepClone(target)

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.mergeDeep(result[key] || {}, source[key])
        } else {
          result[key] = source[key]
        }
      }
    }

    return result
  }

  /**
   * 数组去重
   */
  static unique (array, key = null) {
    if (!Array.isArray(array)) return []

    if (key) {
      const seen = new Set()
      return array.filter(item => {
        const value = item[key]
        if (seen.has(value)) {
          return false
        }
        seen.add(value)
        return true
      })
    } else {
      return [...new Set(array)]
    }
  }

  /**
   * 数组分组
   */
  static groupBy (array, key) {
    if (!Array.isArray(array)) return {}

    return array.reduce((groups, item) => {
      const group = typeof key === 'function' ? key(item) : item[key]
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {})
  }

  /**
   * 数组排��
   */
  static sortBy (array, key, order = 'asc') {
    if (!Array.isArray(array)) return []

    return [...array].sort((a, b) => {
      const aVal = typeof key === 'function' ? key(a) : a[key]
      const bVal = typeof key === 'function' ? key(b) : b[key]

      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  }

  /**
   * 检查环境变量
   */
  static getEnvVar (name, defaultValue = null) {
    return process.env[name] || defaultValue
  }

  /**
   * 验证邮箱格式
   */
  static isValidEmail (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 验证项目名称
   */
  static isValidProjectName (name) {
    // 只允许字母、数字、下划线和连字符，长度1-50
    const nameRegex = /^[a-zA-Z0-9_-]{1,50}$/
    return nameRegex.test(name)
  }

  /**
   * 批量处理数组
   */
  static async batchProcess (array, processor, batchSize = 5, delayMs = 1000) {
    const results = []

    for (let i = 0; i < array.length; i += batchSize) {
      const batch = array.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (item, index) => {
          try {
            return await processor(item, i + index)
          } catch (error) {
            console.error('处理失败:', error.message)
            return null
          }
        })
      )

      results.push(...batchResults.filter(Boolean))

      // 添加延迟
      if (i + batchSize < array.length && delayMs > 0) {
        await this.delay(delayMs)
      }
    }

    return results
  }

  /**
   * 限制并发执行
   */
  static async limitConcurrency (tasks, concurrency = 3) {
    const results = []
    const executing = []

    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1)
        return result
      })

      results.push(promise)
      executing.push(promise)

      if (executing.length >= concurrency) {
        await Promise.race(executing)
      }
    }

    return Promise.all(results)
  }

  /**
   * 缓存装饰器
   */
  static cache (ttl = 60000) { // 默认缓存1分钟
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value
      const cache = new Map()

      descriptor.value = async function (...args) {
        const key = JSON.stringify(args)
        const cached = cache.get(key)

        if (cached && Date.now() - cached.timestamp < ttl) {
          return cached.value
        }

        const result = await originalMethod.apply(this, args)
        cache.set(key, {
          value: result,
          timestamp: Date.now()
        })

        return result
      }

      return descriptor
    }
  }

  /**
   * 性能监控
   */
  static measureTime (fn) {
    return async function (...args) {
      const start = Date.now()
      try {
        const result = await fn.apply(this, args)
        const duration = Date.now() - start
        console.log(`⏱️ ${fn.name || 'Function'} 执行时间: ${duration}ms`)
        return result
      } catch (error) {
        const duration = Date.now() - start
        console.error(`❌ ${fn.name || 'Function'} 执行失败 (${duration}ms):`, error.message)
        throw error
      }
    }
  }
}

module.exports = Utils
