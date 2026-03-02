#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const DailyReportProjectCreator = require('./create-project')
const i18n = require('../utils/i18n')
/* eslint-enable no-console */

/**
 * 批量创建日报项目
 */
class BatchProjectCreator {
  constructor () {
    this.creator = new DailyReportProjectCreator()
  }

  /**
   * 从配置文件批量创建项目
   */
  async batchCreateFromConfig (configPath) {
    const config = this.loadConfig(configPath)

    /* eslint-disable no-console */
    console.log(i18n.t('batch.creating', { count: config.projects.length }))

    for (let i = 0; i < config.projects.length; i++) {
      const project = config.projects[i]
      console.log(`\n[${i + 1}/${config.projects.length}] 创建项目: ${project.name}`)

      try {
        await this.creator.createProject(project.name, project.options)
        console.log(`  ✅ 成功: ${project.name}`)
      } catch (error) {
        console.error(`  ❌ 失败: ${project.name} - ${error.message}`)
      }
    }

    console.log('\n🎉 批量创建完成！')
    /* eslint-enable no-console */
  }

  /**
   * 加载配置文件
   */
  loadConfig (configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`配置文件不存在: ${configPath}`)
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

    if (!config.projects || !Array.isArray(config.projects)) {
      throw new Error('配置文件格式错误，需要包含 projects 数组')
    }

    return config
  }

  /**
   * 生成示例配置文件
   */
  generateExampleConfig () {
    const exampleConfig = {
      projects: [
        {
          name: 'ai-news',
          description: 'AI新闻技术日报',
          options: {
            llmProvider: 'openai',
            model: 'gpt-3.5-turbo',
            limitArticles: 15,
            createGitHub: true
          }
        },
        {
          name: 'frontend-digest',
          description: '前端技术周刊',
          options: {
            llmProvider: 'deepseek',
            model: 'deepseek-chat',
            limitArticles: 20,
            createGitHub: true
          }
        },
        {
          name: 'backend-insights',
          description: '后端技术洞察',
          options: {
            llmProvider: 'openai',
            model: 'gpt-4',
            limitArticles: 10,
            createGitHub: false
          }
        }
      ]
    }

    fs.writeFileSync(
      path.join(__dirname, '../batch-config.example.json'),
      JSON.stringify(exampleConfig, null, 2)
    )

    /* eslint-disable no-console */
    console.log('✅ 示例配置文件已生成: batch-config.example.json')
    /* eslint-enable no-console */
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

    const projects = []
    let addMore = true

    while (addMore) {
      /* eslint-disable no-console */
      console.log('\n📝 配置项目:')
      /* eslint-enable no-console */

      const name = await this.question(rl, '项目名称: ')
      const description = await this.question(rl, '项目描述: ')
      const llmProvider = await this.question(rl, 'LLM提供商 (openai/deepseek): ', 'openai')
      const model = await this.question(rl, '模型名称: ', 'gpt-3.5-turbo')
      const limitArticles = await this.question(rl, '文章数量限制: ', '20')
      const createGitHub = await this.question(rl, '创建GitHub仓库 (y/n): ', 'y')

      projects.push({
        name,
        description,
        options: {
          llmProvider,
          model,
          limitArticles: parseInt(limitArticles),
          createGitHub: createGitHub.toLowerCase() === 'y'
        }
      })

      const continueAdding = await this.question(rl, '继续添加项目 (y/n): ', 'n')
      addMore = continueAdding.toLowerCase() === 'y'
    }

    rl.close()

    // 保存配置
    const config = { projects }
    const configPath = path.join(__dirname, '../batch-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

    /* eslint-disable no-console */
    console.log(`\n✅ 配置已保存到: ${configPath}`)
    /* eslint-enable no-console */

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
  const args = process.argv.slice(2)
  const action = args[0]

  const batchCreator = new BatchProjectCreator()

  switch (action) {
    case 'config':
      batchCreator.generateExampleConfig()
      break

    case 'interactive':
      batchCreator.interactiveConfig()
        .then(configPath => {
          return batchCreator.batchCreateFromConfig(configPath)
        })
        .then(() => {
          process.exit(0)
        })
        .catch(error => {
          console.error('❌ 错误:', error)
          process.exit(1)
        })
      break

    case 'file': {
      const configPath = args[1]
      if (!configPath) {
        /* eslint-disable no-console */
        console.log('用法: node batch-create.js file <config-path>')
        /* eslint-enable no-console */
        process.exit(1)
      }

      batchCreator.batchCreateFromConfig(configPath)
        .then(() => {
          process.exit(0)
        })
        .catch(error => {
          /* eslint-disable no-console */
          console.error('❌ 错误:', error)
          /* eslint-enable no-console */
          process.exit(1)
        })
      break
    }

    default:
      /* eslint-disable no-console */
      console.log('🚀 批量日报项目创建器')
      console.log('')
      console.log('用法:')
      console.log('  node batch-create.js config                    # 生成示例配置文件')
      console.log('  node batch-create.js interactive              # 交互式配置')
      console.log('  node batch-create.js file <config-path>       # 从配置文件创建')
      /* eslint-enable no-console */
      break
  }
}

module.exports = BatchProjectCreator
