/**
 * 深色主题
 * 适用于暗色终端环境
 */

const dark = {
  name: '深色主题',
  colors: {
    success: '\x1b[92m✓\x1b[0m', // 亮绿色勾号
    warning: '\x1b[93m⚡\x1b[0m', // 亮黄色闪电
    error: '\x1b[91m✖\x1b[0m', // 亮红色叉号
    info: '\x1b[96m◎\x1b[0m', // 亮青色圆圈
    debug: '\x1b[37m○\x1b[0m', // 白色圆圈
    highlight: '\x1b[95m◈\x1b[0m', // 亮紫色高亮
    rocket: '\x1b[97m↑\x1b[0m', // 亮白色箭头
    check: '\x1b[92m✓\x1b[0m', // 亮绿色勾号
    cross: '\x1b[91m✖\x1b[0m', // 亮红色叉号
    warningSign: '\x1b[93m⚡\x1b[0m', // 亮黄色闪电
    infoSign: '\x1b[96mℹ\x1b[0m', // 亮青色信息
    folder: '\x1b[94m▸\x1b[0m', // 亮蓝色文件夹
    file: '\x1b[97m▪\x1b[0m', // 亮白色文件
    code: '\x1b[97m#>\x1b[0m', // 亮白色代码
    settings: '\x1b[95m⚙\x1b[0m', // 亮紫色设置
    clock: '\x1b[96m◷\x1b[0m', // 亮青色时钟
    heart: '\x1b[91m♥\x1b[0m', // 亮红心
    star: '\x1b[93m★\x1b[0m', // 亮黄色星星
    fire: '\x1b[91m🔥\x1b[0m', // 亮红色火焰
    lightning: '\x1b[93m⚡\x1b[0m', // 亮黄色闪电
    target: '\x1b[94m◎\x1b[0m' // 亮蓝色目标
  },
  styles: {
    title: (text) => `\n\x1b[1m\x1b[97m╔════════════════════════════════════════╗\x1b[0m\n\x1b[1m\x1b[97m║  ${text.padEnd(42)}║\x1b[0m\n\x1b[1m\x1b[97m╚════════════════════════════════════════╝\x1b[0m\n`,
    section: (text) => `\n\x1b[1m\x1b[96m┌─ ${text}\x1b[0m\n\x1b[36m├───────────────────────────────────────\x1b[0m\n`,
    bullet: (text) => `  \x1b[93m◆\x1b[0m ${text}`,
    number: (num, text) => `  \x1b[94m${num}.\x1b[0m ${text}`,
    indent: (text, level = 1) => '    '.repeat(level) + text,
    bold: (text) => `\x1b[1m\x1b[97m${text}\x1b[0m`,
    italic: (text) => `\x1b[3m\x1b[96m${text}\x1b[0m`,
    code: (text) => `\x1b[90m\x1b[47m ${text} \x1b[0m`,
    blockquote: (text) => `\x1b[37m│ ${text}\x1b[0m`,
    separator: () => '\n\x1b[90m═════════════════════════════════════\x1b[0m\n',
    progress: (current, total) => {
      const percentage = Math.round(current / total * 100)
      const filled = Math.round(current / total * 15)
      const bar = '\x1b[92m' + '●'.repeat(filled) + '\x1b[37m○'.repeat(15 - filled) + '\x1b[0m'
      return `\x1b[1m[\x1b[0m${bar}\x1b[1m] ${percentage}%\x1b[0m`
    }
  }
}

module.exports = dark
