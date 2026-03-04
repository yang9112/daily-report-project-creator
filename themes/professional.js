/**
 * 专业风格主题
 * 适用于企业环境和正式报告
 */

const professional = {
  name: '专业主题',
  colors: {
    success: '\x1b[32m✓\x1b[0m', // 绿色勾号
    warning: '\x1b[33m⚠\x1b[0m', // 黄色警告
    error: '\x1b[31m✗\x1b[0m', // 红色叉号
    info: '\x1b[34mℹ\x1b[0m', // 蓝色信息
    debug: '\x1b[37m◇\x1b[0m', // 灰色菱形
    highlight: '\x1b[35m◆\x1b[0m', // 紫色高亮
    rocket: '\x1b[36m↑\x1b[0m', // 青色箭头
    check: '\x1b[32m[OK]\x1b[0m', // 绿色OK
    cross: '\x1b[31m[FAIL]\x1b[0m', // 红色FAIL
    warningSign: '\x1b[33m[WARN]\x1b[0m', // 黄色WARN
    infoSign: '\x1b[34m[INFO]\x1b[0m', // 蓝色INFO
    folder: '\x1b[34m[DIR]\x1b[0m', // 蓝色目录
    file: '\x1b[37m[FILE]\x1b[0m', // 灰色文件
    code: '\x1b[90m[CODE]\x1b[0m', // 暗灰色代码
    settings: '\x1b[35m[SET]\x1b[0m', // 紫色设置
    clock: '\x1b[36m[TIME]\x1b[0m', // 青色时间
    heart: '\x1b[31m♥\x1b[0m', // 红心
    star: '\x1b[33m★\x1b[0m', // 黄色星星
    fire: '\x1b[31m[CRITICAL]\x1b[0m', // 红色关键
    lightning: '\x1b[33m[FAST]\x1b[0m', // 黄色快速
    target: '\x1b[34m[GOAL]\x1b[0m' // 蓝色目标
  },
  styles: {
    title: (text) => `\n\x1b[1m\x1b[34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n\x1b[1m\x1b[34m│  ${text}\x1b[0m\n\x1b[1m\x1b[34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`,
    section: (text) => `\n\x1b[1m\x1b[36m┌─ ${text}\x1b[0m\n\x1b[36m├───────────────────────────────────────\x1b[0m\n`,
    bullet: (text) => `  \x1b[34m•\x1b[0m ${text}`,
    number: (num, text) => `  \x1b[34m${num}.\x1b[0m ${text}`,
    indent: (text, level = 1) => '  '.repeat(level) + text,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    italic: (text) => `\x1b[3m${text}\x1b[0m`,
    code: (text) => `\x1b[90m\`${text}\`\x1b[0m`,
    blockquote: (text) => `\x1b[90m│ ${text}\x1b[0m`,
    separator: () => '\n\x1b[90m─────────────────────────────────────────────\x1b[0m\n',
    progress: (current, total) => {
      const percentage = Math.round(current / total * 100)
      const filled = Math.round(current / total * 20)
      const bar = '\x1b[32m' + '█'.repeat(filled) + '\x1b[37m' + '░'.repeat(20 - filled) + '\x1b[0m'
      return `\x1b[1m[${bar}] ${percentage}%\x1b[0m`
    }
  }
}

module.exports = professional
