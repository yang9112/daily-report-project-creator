#!/usr/bin/env node

 
const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const DailyReportProjectCreator = require('./create-project')
const i18n = require('../utils/i18n')
const { consoleStyler } = require('../utils/console-styler')
 

/**
 * 批量创建日报项目
 */
class BatchProjectCreator {
  constructor (theme = 'default') {
    this.console = consoleStyler
    this.console.setTheme(theme)
    this.creator = new DailyReportProjectCreator(null, theme)
  }

  /**
   * 从配置文件批量创建项目
   */
  async batchCreateFromConfig (configPath) {
    const config = this.loadConfig(configPath)

    this.console.info(`开始批量创建 ${config.projects.length} 个项目`)

    for (let i = 0; i < config.projects.length; i++) {
      const project = config.projects[i]
      this.console.info(`[${i + 1}/${config.projects.length}] 创建项目: ${project.name}`)

      try {
        await this.creator.createProject(project.name, project.options)
        this.console.success(`成功: ${project.name}`)
      } catch (error) {
        this.console.error(`失败: ${project.name}`, error.message)
      }
    }

    this.console.success('批量创建完成！')
  }

  /**
   * 加载配置文件
   */
  loadConfig (configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`配置文件不存在: ${configPath}`)
    }

    const configContent = fs.readFileSync(configPath, 'utf8')
    const config = JSON.parse(configContent)

    if (!config.projects) {
      throw new Error('配置文件格式错误: 缺少projects字段')
    }

    if (!Array.isArray(config.projects)) {
      throw new Error('配置文件格式错误: projects字段必须是数组')
    }

    return config
  }

  /**
   * 生成示例配置文件
   */
  generateExampleConfig () {
    const config = {
      projects: [
        {
          name: 'frontend-weekly',
          options: {
            createGitHub: false,
            llmProvider: 'openai',
            model: 'gpt-3.5-turbo'
          }
        },
        {
          name: 'backend-daily',
          options: {
            createGitHub: true,
            llmProvider: 'openai',
            model: 'gpt-4'
          }
        }
      ]
    }

    const configPath = path.join(__dirname, '../batch-config.example.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

    this.console.success(`示例配置文件已生成: ${configPath}`)
    return configPath
  }

  /**
   * 交互式配置
   */
  async interactiveConfig () {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    this.console.title('批量项目配置')

    const projects = []
    let addMore = true

    while (addMore) {
      this.console.section(`配置项目 ${projects.length + 1}`)

      const name = await this.question(rl, '项目名称: ')
      if (!name) {
        this.console.warn('项目名称不能为空')
        continue
      }

      const createGitHub = await this.question(rl, '创建GitHub仓库? (y/N): ', 'n')
      const llmProvider = await this.question(rl, 'LLM提供商 (openai): ', 'openai')
      const model = await this.question(rl, '模型 (gpt-3.5-turbo): ', 'gpt-3.5-turbo')

      projects.push({
        name,
        options: {
          createGitHub: createGitHub.toLowerCase() === 'y',
          llmProvider,
          model
        }
      })

      const shouldContinue = await this.question(rl, '添加更多项目? (y/N): ', 'n')
      addMore = shouldContinue.toLowerCase() === 'y'
    }

    rl.close()

    // 保存配置
    const config = { projects }
    const configPath = path.join(__dirname, '../batch-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

    this.console.success(`配置已保存到: ${configPath}`)

    return configPath
  }

  /**
   * 辅助函数：提问并获取答案
   */
  question (rl, query, defaultValue = '') {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer || defaultValue)
      })
    })
  }
}

// 命令行接口
if (require.main === module) {
  const program = new Command()

  program
    .name('daily-report-batch')
    .description('批量创建日报项目')
    .version('1.0.0')
    .option('-l, --lang <language>', '指定语言 (zh-CN, en-US, ja-JP, ko-KR)', 'zh-CN')
    .option('-t, --theme <theme>', '指定主题 (default, minimal, vibrant)', 'default')

  program
    .command('config')
    .description('生成示例配置文件')
    .action((options) => {
      // 设置语言
      i18n.setLocale(program.opts().lang)

      const batchCreator = new BatchProjectCreator(program.opts().theme)
      batchCreator.generateExampleConfig()
    })

  program
    .command('interactive')
    .description('交互式配置')
    .action((options) => {
      // 设置语言
      i18n.setLocale(program.opts().lang)

      const batchCreator = new BatchProjectCreator(program.opts().theme)
      batchCreator.interactiveConfig()
        .then(configPath => {
          return batchCreator.batchCreateFromConfig(configPath)
        })
        .catch(error => {
          batchCreator.console.error('批量创建失败', error.message)
          process.exit(1)
        })
    })

  program
    .command('file <config-path>')
    .description('从配置文件创建项目')
    .action((configPath, options) => {
      // 设置语言
      i18n.setLocale(program.opts().lang)

      const batchCreator = new BatchProjectCreator(program.opts().theme)
      batchCreator.batchCreateFromConfig(configPath)
        .catch(error => {
          batchCreator.console.error('批量创建失败', error.message)
          process.exit(1)
        })
    })

  program.parse()
}

module.exports = BatchProjectCreator
