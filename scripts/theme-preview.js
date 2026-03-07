#!/usr/bin/env node

/* eslint-disable no-console */
const { ConsoleStyler } = require('../utils/console-styler')
const themeManager = require('../themes')
const { Command } = require('commander')

/**
 * 主题预览脚本
 */

class ThemePreview {
  constructor () {
    try {
      this.demoData = {
        title: '主题预览演示',
        section: '功能展示',
        items: [
          '项目创建和初始化',
          '配置文件生成',
          'Git仓库设置',
          '依赖安装和验证'
        ],
        tableHeaders: ['功能', '状态', '进度'],
        tableRows: [
          { 功能: '基础模板', 状态: '完成', 进度: '100%' },
          { 功能: '国际化', 状态: '进行中', 进度: '80%' },
          { 功能: '主题系统', 状态: '新功能', 进度: '60%' }
        ],
        codeExample: 'console.log("Hello, Daily Report!");',
        blockquoteText: '这是一个引用块示例，展示主题的引用样式。'
      }
    } catch (error) {
      console.error('主题预览初始化失败:', error.message)
      throw error
    }
  }

  /**
   * 展示单个主题
   */
  showTheme (themeName) {
    try {
      if (!themeManager.setTheme(themeName)) {
        console.error(`主题 "${themeName}" 不存在`)
        return false
      }

      const styler = new ConsoleStyler(themeName)
      const theme = themeManager.getCurrentTheme()

      console.clear()
      styler.title(`🎨 ${theme.name} 预览`)

      // 基础消息类型
      styler.section('基础消息类型')
      styler.success('这是一个成功消息', '操作执行成功')
      styler.warn('这是一个警告消息', '需要注意的事项')
      styler.error('这是一个错误消息', '发生的问题描述')
      styler.info('这是一个信息消息', '额外的详细信息')

      // 格式化样式
      styler.section('格式化样式')
      styler.bullet('这是一个项目符号列表项目')
      styler.number(1, '这是一个编号列表项目')
      styler.number(2, '这是另一个编号列表项目')

      styler.bold('这是粗体文本')
      styler.italic('这是斜体文本')
      styler.code(this.demoData.codeExample)
      styler.blockquote(this.demoData.blockquoteText)

      // 进度条演示
      styler.section('进度条演示')
      styler.progress(3, 10, '当前进度')
      styler.progress(5, 10, '当前进度')
      styler.progress(8, 10, '当前进度')
      styler.progress(10, 10, '当前进度')

      // 表格演示
      styler.section('表格演示')
      styler.table(this.demoData.tableHeaders, this.demoData.tableRows)

      // 列表演示
      styler.section('项目列表演示')
      styler.list(this.demoData.items)

      // 状态消息
      styler.section('状态消息演示')
      styler.status('success', '成功完成所有任务')
      styler.status('warning', '发现潜在问题')
      styler.status('error', '执行失败')
      styler.status('info', '处理中请稍候')

      // 文件树演示
      styler.section('文件树演示')
      const fileTree = {
        project: {
          src: {
            'main.js': null,
            'utils.js': null
          },
          config: {
            'app.json': null
          },
          'README.md': null
        }
      }
      styler.fileTree(fileTree)

      styler.separator()
      styler.success(`"${theme.name}" 预览完成`)

      return true
    } catch (error) {
      console.error(`展示主题 "${themeName}" 时发生错误:`, error.message)
      return false
    }
  }

  /**
   * 展示所有可用主题
   */
  listThemes () {
    const styler = new ConsoleStyler()

    styler.title('🎨 可用主题列表')

    const themes = themeManager.getThemeList()
    themes.forEach((theme, index) => {
      styler.number(index + 1, `${theme.name} (${theme.displayName})`)
    })

    styler.section('使用方法')
    styler.bullet('预览单个主题: theme-preview <theme-name>')
    styler.bullet('展示所有主题: theme-preview --list')
    styler.bullet('创建项目时指定主题: daily-report-create <project> --theme <theme-name>')
  }

  /**
   * 交互式主题选择
   */
  async interactiveSelection () {
    try {
      const styler = new ConsoleStyler()

      styler.title('🎨 交互式主题选择')

      const themes = themeManager.getThemeList()

      // 简化的交互演示
      styler.info('可用主题：')
      themes.forEach((theme, index) => {
        styler.number(index + 1, `${theme.name} - ${theme.displayName}`)
      })

      return themes
    } catch (error) {
      console.error('交互式选择时发生错误:', error.message)
      return []
    }
  }
}

// 命令行接口
if (require.main === module) {
  const program = new Command()
  const preview = new ThemePreview()

  program
    .name('theme-preview')
    .description('预览和选择控制台主题')
    .version('1.0.0')
    .argument('[theme-name]', '要预览的主题名称')
    .option('-l, --list', '列出所有可用主题')
    .option('-i, --interactive', '交互式主题选择')
    .action((themeName, options) => {
      if (options.list) {
        preview.listThemes()
        return
      }

      if (options.interactive) {
        preview.interactiveSelection()
        return
      }

      if (themeName) {
        preview.showTheme(themeName)
      } else {
        // 默认展示所有主题
        const themes = ['default', 'minimal', 'vibrant', 'professional', 'dark', 'colorful']
        const styler = new ConsoleStyler()

        styler.title('🎨 主题系统演示')
        styler.info('将依次展示所有可用主题...')

        for (const theme of themes) {
          styler.info(`正在展示: ${theme}`)
          preview.showTheme(theme)

          // 等待用户按回车继续
          if (process.stdin.isTTY) {
            styler.pause('按 Enter 键继续下一个主题...')
          } else {
            // 非TTY环境，自动继续
            styler.info('继续下一个主题...')
          }
        }

        styler.success('所有主题预览完成！')
        styler.info('使用 theme-preview <theme-name> 查看特定主题')
      }
    })

  program.parse()
}

module.exports = ThemePreview
