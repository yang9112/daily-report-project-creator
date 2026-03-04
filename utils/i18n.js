/**
 * 国际化工具模块
 */

const I18nConfig = require('../i18n/config')

class I18n {
  constructor () {
    this.config = new I18nConfig()
    this.currentLocale = this.getLocale()
  }

  /**
   * 获取当前语言环境
   */
  getLocale () {
    // 优先使用命令行参数指定的语言
    const args = process.argv.slice(2)
    const langIndex = args.findIndex(arg => arg === '--lang' || arg === '-l')
    if (langIndex !== -1 && args[langIndex + 1]) {
      const requestedLang = args[langIndex + 1]
      if (this.config.supportedLocales.includes(requestedLang)) {
        return requestedLang
      }
    }

    // 其次使用环境变量
    const envLang = process.env.LANG || process.env.LANGUAGE
    if (envLang) {
      if (envLang.startsWith('en')) {
        return 'en-US'
      } else if (envLang.startsWith('zh')) {
        return 'zh-CN'
      }
    }

    // 最后使用默认语言
    return this.config.defaultLocale
  }

  /**
   * 获取国际化文本
   */
  t (key, variables = {}) {
    let message = this.config.getMessage(key, this.currentLocale)

    // 处理变量替换
    Object.keys(variables).forEach(variable => {
      message = message.replace(new RegExp(`\\{${variable}\\}`, 'g'), variables[variable])
    })

    return message
  }

  /**
   * 设置语言
   */
  setLocale (locale) {
    if (this.config.supportedLocales.includes(locale)) {
      this.currentLocale = locale
      return true
    }
    return false
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLocales () {
    return this.config.supportedLocales
  }
}

// 创建单例实例
const i18n = new I18n()

module.exports = i18n
