/**
 * 彩色主题
 * 使用丰富的彩虹色彩
 */

const colorful = {
  name: '彩虹主题',
  colors: {
    success: '\x1b[38;5;40m✅\x1b[0m', // 绿色勾号
    warning: '\x1b[38;5;226m⚠️\x1b[0m', // 黄色警告
    error: '\x1b[38;5:196m❌\x1b[0m', // 红色叉号
    info: '\x1b[38;5;33m💡\x1b[0m', // 蓝色灯泡
    debug: '\x1b[38;5;245m◻️\x1b[0m', // 灰色方块
    highlight: '\x1b[38;5;201m✨\x1b[0m', // 紫色星星
    rocket: '\x1b[38;5;46m🚀\x1b[0m', // 青色火箭
    check: '\x1b[38;5;40m✓\x1b[0m', // 绿色勾号
    cross: '\x1b[38;5;196m✗\x1b[0m', // 红色叉号
    warningSign: '\x1b[38;5;226m⚡\x1b[0m', // 黄色闪电
    infoSign: '\x1b[38;5;33mℹ️\x1b[0m', // 蓝色信息
    folder: '\x1b[38;5;33m📁\x1b[0m', // 蓝色文件夹
    file: '\x1b[38;5;130m📄\x1b[0m', // 橙色文件
    code: '\x1b[38;5;21m💻\x1b[0m', // 深蓝色电脑
    settings: '\x1b[38;5;165m⚙️\x1b[0m', // 紫色设置
    clock: '\x1b[38;5;45m⏰\x1b[0m', // 天蓝色时钟
    heart: '\x1b[38;5;198m💖\x1b[0m', // 粉红爱心
    star: '\x1b[38;5;226m⭐\x1b[0m', // 黄色星星
    fire: '\x1b[38;5;196m🔥\x1b[0m', // 红色火焰
    lightning: '\x1b[38;5;226m⚡\x1b[0m', // 黄色闪电
    target: '\x1b[38;5;46m🎯\x1b[0m' // 青色目标
  },
  styles: {
    title: (text) => {
      const rainbowColors = ['\x1b[38;5;196m', '\x1b[38;5;202m', '\x1b[38;5;208m', '\x1b[38;5;226m', '\x1b[38;5;40m', '\x1b[38;5;33m', '\x1b[38;5;90m']
      const border = '═'.repeat(text.length + 8)
      let coloredBorder = ''
      for (let i = 0; i < border.length; i++) {
        coloredBorder += rainbowColors[i % rainbowColors.length] + border[i]
      }
      return `\n${coloredBorder}\x1b[0m\n\x1b[1m\x1b[38;5;201m●    ${text}    ●\x1b[0m\n${coloredBorder}\x1b[0m\n`
    },
    section: (text) => `\n\x1b[1m\x1b[38;5;46m┌─ 🌈 ${text} 🌈\x1b[0m\n\x1b[38;5;135m├${'─'.repeat(text.length + 13)}\x1b[0m\n`,
    bullet: (text) => `  \x1b[38;5;226m🔸\x1b[0m ${text}`,
    number: (num, text) => `  \x1b[38;5;40m${num}.\x1b[0m ${text}`,
    indent: (text, level = 1) => '  '.repeat(level) + text,
    bold: (text) => `\x1b[1m\x1b[38;5;201m${text}\x1b[0m`,
    italic: (text) => `\x1b[3m\x1b[38;5;46m${text}\x1b[0m`,
    code: (text) => `\x1b[48;5;33m\x1b[97m ${text} \x1b[0m`,
    blockquote: (text) => `\x1b[38;5;135m▌ ${text}\x1b[0m`,
    separator: () => {
      const rainbowChars = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣']
      let separator = '\n'
      for (let i = 0; i < 15; i++) {
        separator += rainbowChars[i % rainbowChars.length] + ' '
      }
      return separator + '\n'
    },
    progress: (current, total) => {
      const percentage = Math.round(current / total * 100)
      const filled = Math.round(current / total * 20)
      const colors = ['\x1b[38;5;196m', '\x1b[38;5;202m', '\x1b[38;5;208m', '\x1b[38;5;226m', '\x1b[38;5;40m', '\x1b[38;5;33m']
      let bar = ''
      for (let i = 0; i < 20; i++) {
        if (i < filled) {
          const color = colors[i % colors.length]
          bar += color + '█'
        } else {
          bar += '\x1b[38;5;245m' + '░'
        }
      }
      return `\x1b[1m[${bar}\x1b[0m\x1b[1m] \x1b[38;5;226m${percentage}%\x1b[0m`
    }
  }
}

module.exports = colorful
