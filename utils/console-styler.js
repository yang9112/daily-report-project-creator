/**
 * 控制台样式化输出工具
 */

const themeManager = require('../themes')

class ConsoleStyler {
  constructor(theme = 'default') {
    this.setTheme(theme)
  }

  /**
   * 设置主题
   */
  setTheme(themeName) {
    if (themeManager.setTheme(themeName)) {
      this.theme = themeManager.getCurrentTheme()
      return true
    }
    return false
  }

  /**
   * 获取当前主题
   */
  getTheme() {
    return this.theme
  }

  /**
   * 成功消息
   */
  success(message, details = '') {
    console.log(this.theme.colors.success, message)
    if (details) {
      console.log(this.theme.styles.indent(details))
    }
  }

  /**
   * 错误消息
   */
  error(message, details = '') {
    console.error(this.theme.colors.error, message)
    if (details) {
      console.error(this.theme.styles.indent(details))
    }
  }

  /**
   * 警告消息
   */
  warn(message, details = '') {
    console.warn(this.theme.colors.warning, message)
    if (details) {
      console.warn(this.theme.styles.indent(details))
    }
  }

  /**
   * 信息消息
   */
  info(message, details = '') {
    console.info(this.theme.colors.info, message)
    if (details) {
      console.info(this.theme.styles.indent(details))
    }
  }

  /**
   * 调试消息
   */
  debug(message, details = '') {
    if (process.env.DEBUG) {
      console.debug(this.theme.colors.debug, message)
      if (details) {
        console.debug(this.theme.styles.indent(details))
      }
    }
  }

  /**
   * 标题
   */
  title(text) {
    console.log(this.theme.styles.title(text))
  }

  /**
   * 章节标题
   */
  section(text) {
    console.log(this.theme.styles.section(text))
  }

  /**
   * 分隔线
   */
  separator() {
    console.log(this.theme.styles.separator())
  }

  /**
   * 项目符号列表
   */
  bullet(text, level = 0) {
    console.log(this.theme.styles.indent(this.theme.styles.bullet(text), level))
  }

  /**
   * 编号列表
   */
  number(num, text, level = 0) {
    console.log(this.theme.styles.indent(this.theme.styles.number(num, text), level))
  }

  /**
   * 进度条
   */
  progress(current, total, label = '') {
    console.log(themeManager.createProgress(current, total, label))
  }

  /**
   * 状态消息
   */
  status(type, message, details = '') {
    console.log(themeManager.createStatusMessage(type, message, details))
  }

  /**
   * 代码块
   */
  code(text) {
    console.log(this.theme.styles.code(text))
  }

  /**
   * 引用块
   */
  blockquote(text) {
    console.log(this.theme.styles.blockquote(text))
  }

  /**
   * 粗体文本 (在支持的终端中)
   */
  bold(text) {
    console.log(this.theme.styles.bold(text))
  }

  /**
   * 斜体文本 (在支持的终端中)
   */
  italic(text) {
    console.log(this.theme.styles.italic(text))
  }

  /**
   * 表格输出
   */
  table(headers, rows, options = {}) {
    console.log(themeManager.createTable(headers, rows, options))
  }

  /**
   * 列表输出
   */
  list(items, options = {}) {
    console.log(themeManager.createList(items, options))
  }

  /**
   * 刷新进度显示
   */
  updateProgress(current, total, label = '') {
    // 使用 \r 回到行首覆盖输出
    process.stdout.write(`\r${themeManager.createProgress(current, total, label)}`)
    if (current >= total) {
      process.stdout.write('\n') // 完成时换行
    }
  }

  /**
   * 创建交互式选择菜单
   */
  menu(title, options, selectedIndex = 0) {
    this.title(title)
    
    options.forEach((option, index) => {
      const prefix = index === selectedIndex ? this.theme.colors.target : ' '
      const text = index === selectedIndex 
        ? this.theme.styles.bold(option)
        : option
      this.number(index + 1, `${prefix} ${text}`)
    })
    
    return selectedIndex
  }

  /**
   * 显示加载动画
   */
  spinner(message, duration = 2000) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let i = 0
    
    return new Promise(resolve => {
      const interval = setInterval(() => {
        process.stdout.write(`\r${frames[i]} ${message}`)
        i = (i + 1) % frames.length
      }, 100)
      
      setTimeout(() => {
        clearInterval(interval)
        process.stdout.write('\r' + ' '.repeat(message.length + 5) + '\r')
        resolve()
      }, duration)
    })
  }

  /**
   * 高亮显示关键词
   */
  highlight(text, keywords) {
    let result = text
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi')
      result = result.replace(regex, this.theme.colors.highlight + '$1')
    })
    return result
  }

  /**
   * 显示文件树结构
   */
  fileTree(tree, level = 0) {
    Object.entries(tree).forEach(([name, content]) => {
      const prefix = '  '.repeat(level)
      if (typeof content === 'object') {
        console.log(`${prefix}${this.theme.colors.folder} ${name}/`)
        this.fileTree(content, level + 1)
      } else {
        console.log(`${prefix}${this.theme.colors.file} ${name}`)
      }
    })
  }

  /**
   * 显示时间戳
   */
  timestamp(message) {
    const now = new Date().toLocaleTimeString()
    console.log(`${this.theme.colors.clock} [${now}] ${message}`)
  }

  /**
   * 清屏
   */
  clear() {
    console.clear()
  }

  /**
   * 暂停等待用户输入
   */
  pause(message = '按 Enter 键继续...') {
    console.log(`${this.theme.colors.info} ${message}`)
    return new Promise(resolve => {
      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on('data', key => {
        if (key.toString() === '\r' || key.toString() === '\n') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          resolve()
        }
      })
    })
  }
}

// 创建默认实例
const consoleStyler = new ConsoleStyler()

module.exports = { ConsoleStyler, consoleStyler }