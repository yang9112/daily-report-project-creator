#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
/* eslint-enable no-console */

/**
 * 配置验证工具
 * 验证生成项目的配置文件和环境设置
 */
class ConfigValidator {
  constructor (consoleStyler = null) {
    this.console = consoleStyler || console
    this.errors = []
    this.warnings = []
    this.projectPath = null
  }

  /**
   * 验证项目配置
   */
  async validateProject (projectPath) {
    this.projectPath = projectPath
    this.console.info('🔍 开始项目配置验证...')

    // 验证基础结构
    this.validateBasicStructure()

    // 验证配置文件
    this.validateConfigFiles()

    // 验证依赖安装
    await this.validateDependencies()

    // 验证数据库连接
    this.validateDatabaseSetup()

    // 验证脚本功能
    this.validateScripts()

    // 生成验证报告
    this.generateValidationReport()

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  /**
   * 验证基础项目结构
   */
  validateBasicStructure () {
    this.console.info('📁 验证项目结构...')

    const requiredPaths = [
      'src',
      'config',
      'package.json',
      '.env.example',
      'config/config.example.json',
      'config/sources.example.json'
    ]

    requiredPaths.forEach(relativePath => {
      const fullPath = path.join(this.projectPath, relativePath)
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`缺少必要文件或目录: ${relativePath}`)
      } else {
        this.console.success(`  ✅ ${relativePath}`)
      }
    })
  }

  /**
   * 验证配置文件
   */
  validateConfigFiles () {
    this.console.info('⚙️ 验证配置文件...')

    // 验证config.example.json
    const configExamplePath = path.join(this.projectPath, 'config/config.example.json')
    if (fs.existsSync(configExamplePath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configExamplePath, 'utf8'))
        this.validateConfigStructure(config)
        this.console.success('  ✅ config.example.json 结构正确')
      } catch (error) {
        this.errors.push(`config.example.json 解析错误: ${error.message}`)
      }
    }

    // 验证sources.example.json
    const sourcesExamplePath = path.join(this.projectPath, 'config/sources.example.json')
    if (fs.existsSync(sourcesExamplePath)) {
      try {
        const sources = JSON.parse(fs.readFileSync(sourcesExamplePath, 'utf8'))
        this.validateSourcesStructure(sources)
        this.console.success('  ✅ sources.example.json 结构正确')
      } catch (error) {
        this.errors.push(`sources.example.json 解析错误: ${error.message}`)
      }
    }

    // 验证.env.example
    const envExamplePath = path.join(this.projectPath, '.env.example')
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf8')
      const requiredVars = ['OPENAI_API_KEY', 'DB_PATH']

      requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
          this.console.success(`  ✅ 环境变量 ${varName} 已定义`)
        } else {
          this.warnings.push(`环境变量 ${varName} 未在.env.example中定义`)
        }
      })
    }
  }

  /**
   * 验证配置结构
   */
  validateConfigStructure (config) {
    const requiredFields = ['database', 'llm', 'digest']

    requiredFields.forEach(field => {
      if (!config[field]) {
        this.errors.push(`配置文件缺少必要字段: ${field}`)
      }
    })

    // 验证数据库配置
    if (config.database) {
      if (!config.database.path) {
        this.errors.push('数据库配置缺少path字段')
      }
    }

    // 验证LLM配置
    if (config.llm) {
      if (!config.llm.provider) {
        this.errors.push('LLM配置缺少provider字段')
      }
      if (!config.llm.api_key || config.llm.api_key === 'your-api-key-here') {
        this.warnings.push('LLM配置需要设置有效的API密钥')
      }
    }

    // 验证摘要配置
    if (config.digest) {
      if (!config.digest.output_dir) {
        this.errors.push('摘要配置缺少output_dir字段')
      }
    }
  }

  /**
   * 验证数据源配置
   */
  validateSourcesStructure (sources) {
    if (!Array.isArray(sources)) {
      this.errors.push('sources配置必须是数组格式')
      return
    }

    if (sources.length === 0) {
      this.warnings.push('未配置任何数据源')
      return
    }

    sources.forEach((source, index) => {
      if (!source.name) {
        this.errors.push(`数据源 ${index} 缺少name字段`)
      }
      if (!source.feed_url) {
        this.errors.push(`数据源 ${index} 缺少feed_url字段`)
      }
      if (!source.type) {
        this.warnings.push(`数据源 ${index} 缺少type字段，将默认为rss`)
      }
    })
  }

  /**
   * 验证依赖安装
   */
  async validateDependencies () {
    this.console.info('📦 验证依赖安装...')

    try {
      // 检查package.json是否存在
      const packageJsonPath = path.join(this.projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        this.errors.push('缺少package.json文件')
        return
      }

      // 检查node_modules目录
      const nodeModulesPath = path.join(this.projectPath, 'node_modules')
      if (!fs.existsSync(nodeModulesPath)) {
        this.warnings.push('node_modules目录不存在，需要运行 npm install')
        this.console.warn('  ⚠️ node_modules目录不存在，请运行 npm install')
        // 不再自动安装依赖，因为可能耗时过长
        return
      } else {
        this.console.success('  ✅ node_modules目录存在')
      }

      // 验证关键依赖
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const criticalDeps = ['sqlite3', 'rss-parser', 'axios', 'commander']

      criticalDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          const depPath = path.join(nodeModulesPath, dep)
          if (fs.existsSync(depPath)) {
            this.console.success(`  ✅ 依赖 ${dep} 已安装`)
          } else {
            this.errors.push(`依赖 ${dep} 未正确安装`)
          }
        } else {
          this.warnings.push(`package.json中未找到关键依赖: ${dep}`)
        }
      })
    } catch (error) {
      this.errors.push(`依赖验证失败: ${error.message}`)
    }
  }

  /**
   * 验证数据库设置
   */
  validateDatabaseSetup () {
    this.console.info('🗄️ 验证数据库设置...')

    const dataDir = path.join(this.projectPath, 'data')

    // 检查data目录是否存在
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true })
        this.console.success('  ✅ 创建data目录')
      } catch (error) {
        this.errors.push(`无法创建data目录: ${error.message}`)
        return
      }
    } else {
      this.console.success('  ✅ data目录存在')
    }

    // 检查是否可以创建数据库文件
    const dbPath = path.join(dataDir, 'daily_report.db')
    try {
      // 先检查sqlite3是否已安装
      require.resolve('sqlite3')

      const Database = require('sqlite3').Database
      const testDb = new Database(dbPath)

      // 测试基本表创建
      testDb.serialize(() => {
        testDb.run(`
          CREATE TABLE IF NOT EXISTS test (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)
      })

      testDb.close()

      // 清理测试文件
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
      }

      this.console.success('  ✅ 数据库连接测试通过')
    } catch (error) {
      if (error.message.includes('Cannot find module')) {
        this.warnings.push('sqlite3模块未安装，数据库功能暂无法验证（请运行 npm install）')
      } else {
        this.errors.push(`数据库配置验证失败: ${error.message}`)
      }
    }
  }

  /**
   * 验证脚本功能
   */
  validateScripts () {
    this.console.info('🔧 验证脚本功能...')

    // 验证package.json中的scripts
    const packageJsonPath = path.join(this.projectPath, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        const scripts = packageJson.scripts || {}

        const requiredScripts = ['start', 'setup', 'test']
        requiredScripts.forEach(script => {
          if (scripts[script]) {
            this.console.success(`  ✅ 脚本 ${script} 已定义`)
          } else {
            this.warnings.push(`建议添加脚本: ${script}`)
          }
        })
      } catch (error) {
        this.errors.push(`package.json解析失败: ${error.message}`)
      }
    }

    // 验证主入口文件
    const indexJsPath = path.join(this.projectPath, 'src/index.js')
    if (fs.existsSync(indexJsPath)) {
      try {
        // 简单的语法检查
        fs.readFileSync(indexJsPath, 'utf8')
        // 这里可以添加更复杂的语法验证
        this.console.success('  ✅ 主入口文件存在')
      } catch (error) {
        this.errors.push(`主入口文件验证失败: ${error.message}`)
      }
    } else {
      this.errors.push('主入口文件src/index.js不存在')
    }
  }

  /**
   * 生成验证报告
   */
  generateValidationReport () {
    this.console.info('\n📊 配置验证结果报告')

    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.console.success('🎉 配置验证全部通过！')
      return
    }

    if (this.errors.length > 0) {
      this.console.error('\n❌ 错误:')
      this.errors.forEach(error => {
        this.console.error(`  • ${error}`)
      })
    }

    if (this.warnings.length > 0) {
      this.console.warn('\n⚠️  警告:')
      this.warnings.forEach(warning => {
        this.console.warn(`  • ${warning}`)
      })
    }

    // 提供修复建议
    if (this.errors.length > 0) {
      this.console.info('\n🔧 修复建议:')
      this.console.info('  1. 检查并修复配置文件格式错误')
      this.console.info('  2. 确保所有必要文件都已创建')
      this.console.info('  3. 运行 npm install 安装缺失依赖')
      this.console.info('  4. 检查数据库权限设置')
    }

    if (this.warnings.length > 0) {
      this.console.info('\n💡 优化建议:')
      this.console.info('  1. 设置有效的API密钥以确保功能正常')
      this.console.info('  2. 配置更多数据源以获得更丰富的内容')
      this.console.info('  3. 根据需要调整输出格式和目录设置')
    }
  }
}

module.exports = ConfigValidator
