/**
 * 主题样式系统
 */

// 导入新增的主题
const professional = require('./professional')
const dark = require('./dark')
const colorful = require('./colorful')

class ThemeManager {
  constructor() {
    this.currentTheme = 'default'
    this.themes = {
      default: {
        name: '默认主题',
        colors: {
          success: '🟢',
          warning: '🟡', 
          error: '🔴',
          info: '🔵',
          debug: '⚪',
          highlight: '✨',
          rocket: '🚀',
          check: '✅',
          cross: '❌',
          warningSign: '⚠️',
          infoSign: 'ℹ️',
          folder: '📁',
          file: '📄',
          code: '💻',
          settings: '⚙️',
          clock: '⏰',
          heart: '❤️',
          star: '⭐',
          fire: '🔥',
          lightning: '⚡',
          target: '🎯'
        },
        styles: {
          title: (text) => `\n=== ${text} ===\n`,
          section: (text) => `\n--- ${text} ---\n`,
          bullet: (text) => `• ${text}`,
          number: (num, text) => `${num}. ${text}`,
          indent: (text, level = 1) => '  '.repeat(level) + text,
          bold: (text) => `**${text}**`,
          italic: (text) => `*${text}*`,
          code: (text) => `\`${text}\``,
          blockquote: (text) => `│ ${text}`,
          separator: () => '\n' + '─'.repeat(50) + '\n',
          progress: (current, total) => `[${'█'.repeat(Math.round(current/total*10))}${'░'.repeat(10-Math.round(current/total*10))}] ${Math.round(current/total*100)}%`
        }
      },
      minimal: {
        name: '极简主题',
        colors: {
          success: '[OK]',
          warning: '[WARN]',
          error: '[ERROR]',
          info: '[INFO]',
          debug: '[DEBUG]',
          highlight: '[HIGHLIGHT]',
          rocket: '>>',
          check: '✓',
          cross: '✗',
          warningSign: '!',
          infoSign: 'i',
          folder: '[DIR]',
          file: '[FILE]',
          code: '[CODE]',
          settings: '[SET]',
          clock: '[TIME]',
          heart: '[LOVE]',
          star: '[STAR]',
          fire: '[FIRE]',
          lightning: '[FAST]',
          target: '[GOAL]'
        },
        styles: {
          title: (text) => `\n${text}\n${'='.repeat(text.length)}\n`,
          section: (text) => `\n${text}\n${'-'.repeat(text.length)}\n`,
          bullet: (text) => `• ${text}`,
          number: (num, text) => `${num}. ${text}`,
          indent: (text, level = 1) => '  '.repeat(level) + text,
          bold: (text) => text.toUpperCase(),
          italic: (text) => `_${text}_`,
          code: (text) => `"${text}"`,
          blockquote: (text) => `> ${text}`,
          separator: () => '\n' + '-'.repeat(30) + '\n',
          progress: (current, total) => `${current}/${total} (${Math.round(current/total*100)}%)`
        }
      },
      vibrant: {
        name: '活力主题',
        colors: {
          success: '💚',
          warning: '💛',
          error: '❤️',
          info: '💙',
          debug: '🤍',
          highlight: '🌈',
          rocket: '🚀',
          check: '✅',
          cross: '❌',
          warningSign: '⚠️',
          infoSign: '💡',
          folder: '📂',
          file: '📝',
          code: '👨‍💻',
          settings: '🔧',
          clock: '⏰',
          heart: '💖',
          star: '⭐',
          fire: '🔥',
          lightning: '⚡',
          target: '🎯'
        },
        styles: {
          title: (text) => `\n🌟 ${text} 🌟\n${'✨'.repeat(10)}\n`,
          section: (text) => `\n💫 ${text} 💫\n`,
          bullet: (text) => `🔸 ${text}`,
          number: (num, text) => `🔢 ${num}. ${text}`,
          indent: (text, level = 1) => `${'  '.repeat(level)}🔸 ${text}`,
          bold: (text) => `🔥 ${text} 🔥`,
          italic: (text) => `💭 ${text} 💭`,
          code: (text) => `💻 ${text} 💻`,
          blockquote: (text) => `💬 ${text}`,
          separator: () => '\n' + '🌟'.repeat(20) + '\n',
          progress: (current, total) => `📊 ${'🟢'.repeat(Math.round(current/total*10))}${'⚪'.repeat(10-Math.round(current/total*10))} ${Math.round(current/total*100)}% 📊`
        }
      },
      professional,
      dark,
      colorful
    }
  }

  /**
   * 设置主题
   */
  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName
      return true
    }
    return false
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return this.themes[this.currentTheme]
  }

  /**
   * 获取主题列表
   */
  getThemeList() {
    return Object.keys(this.themes).map(key => ({
      name: key,
      displayName: this.themes[key].name
    }))
  }

  /**
   * 格式化消息
   */
  formatMessage(type, message, options = {}) {
    const theme = this.getCurrentTheme()
    const icon = theme.colors[type] || theme.colors.info
    return `${icon} ${message}`
  }

  /**
   * 应用样式
   */
  applyStyle(styleName, text, ...args) {
    const theme = this.getCurrentTheme()
    const style = theme.styles[styleName]
    return style ? style(text, ...args) : text
  }

  /**
   * 创建进度条
   */
  createProgress(current, total, label = '') {
    const theme = this.getCurrentTheme()
    const progressBar = theme.styles.progress(current, total)
    return label ? `${label}: ${progressBar}` : progressBar
  }

  /**
   * 创建状态消息
   */
  createStatusMessage(type, message, details = '') {
    const theme = this.getCurrentTheme()
    const icon = theme.colors[type] || theme.colors.info
    let output = `${icon} ${message}`
    if (details) {
      output += `\n${theme.styles.indent(details)}`
    }
    return output
  }

  /**
   * 创建表格输出
   */
  createTable(headers, rows, options = {}) {
    const theme = this.getCurrentTheme()
    const { showIndex = false, maxWidth = 80 } = options
    
    let output = theme.styles.title('数据表格')
    
    // 计算列宽
    const colWidths = headers.map(header => 
      Math.min(Math.max(header.length, ...rows.map(row => String(row[header]).length)), maxWidth / headers.length)
    )
    
    // 表头
    const headerRow = headers.map((header, i) => 
      header.padEnd(colWidths[i])
    ).join(' | ')
    output += theme.styles.section(headerRow)
    
    // 数据行
    rows.forEach((row, index) => {
      const dataCells = headers.map((header, i) => 
        String(row[header]).padEnd(colWidths[i])
      ).join(' | ')
      
      const prefix = showIndex ? `${index + 1}. ` : ''
      output += theme.styles.bullet(`${prefix}${dataCells}`)
    })
    
    return output
  }

  /**
   * 创建列表输出
   */
  createList(items, options = {}) {
    const theme = this.getCurrentTheme()
    const { numbered = false, indent = 0 } = options
    
    let output = theme.styles.title('项目列表')
    
    items.forEach((item, index) => {
      const text = typeof item === 'string' ? item : item.text
      const formatted = numbered 
        ? theme.styles.number(index + 1, text)
        : theme.styles.bullet(text)
      
      output += theme.styles.indent(formatted, indent)
    })
    
    return output
  }
}

// 创建单例实例
const themeManager = new ThemeManager()

module.exports = themeManager