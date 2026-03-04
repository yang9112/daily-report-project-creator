/**
 * 国际化配置
 */

const path = require('path')
const fs = require('fs')

class I18nConfig {
  constructor () {
    this.defaultLocale = 'zh-CN'
    this.supportedLocales = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR']
    this.localesDir = path.join(__dirname, '../locales')
    this.messages = {}
    this.loadMessages()
  }

  loadMessages () {
    this.supportedLocales.forEach(locale => {
      const filePath = path.join(this.localesDir, `${locale}.json`)
      try {
        if (fs.existsSync(filePath)) {
          this.messages[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        }
      } catch (error) {
        console.warn(`Failed to load locale file for ${locale}:`, error.message)
        this.messages[locale] = {}
      }
    })
  }

  getMessage (key, locale = this.defaultLocale) {
    const localeMessages = this.messages[locale] || this.messages[this.defaultLocale] || {}

    // Handle nested keys (e.g., "project.creating")
    const keys = key.split('.')
    let result = localeMessages

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k]
      } else {
        return key // Return key if not found
      }
    }

    return typeof result === 'string' ? result : key
  }

  getLocale () {
    // 默认使用系统语言或中文
    const systemLocale = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES
    if (systemLocale && systemLocale.startsWith('en')) {
      return 'en-US'
    } else if (systemLocale && systemLocale.startsWith('ja')) {
      return 'ja-JP'
    } else if (systemLocale && systemLocale.startsWith('ko')) {
      return 'ko-KR'
    }
    return this.defaultLocale
  }
}

module.exports = I18nConfig
