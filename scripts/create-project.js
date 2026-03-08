#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { Command } = require('commander')
const i18n = require('../utils/i18n')
const { consoleStyler } = require('../utils/console-styler')
/* eslint-enable no-console */

/**
 * 基于tech-daily-digest创建新的日报项目
 */
class DailyReportProjectCreator {
  constructor (i18nInstance = null, theme = 'default') {
    this.baseSkillPath = '/root/workspace/skills/tech-daily-digest'
    // 根据环境设置输出目录
    this.outputDir = process.env.NODE_ENV === 'test' ? '/tmp/github-projects' : '/root/workspace/github-projects'
    this.i18n = i18nInstance || i18n
    this.console = consoleStyler
    this.console.setTheme(theme)
  }

  /**
   * 验证项目名称
   */
  validateProjectName (projectName) {
    if (!projectName || typeof projectName !== 'string') {
      throw new Error(this.i18n.t('project.validation.empty'))
    }

    if (projectName.trim().length === 0) {
      throw new Error(this.i18n.t('project.validation.trim_empty'))
    }

    if (projectName.length > 50) {
      throw new Error(this.i18n.t('project.validation.too_long'))
    }

    // 检查是否包含非法字符
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      throw new Error(this.i18n.t('project.validation.invalid_chars'))
    }

    return true
  }

  /**
   * 创建新项目
   */
  async createProject (projectName, options = {}) {
    // 验证项目名称
    this.validateProjectName(projectName)

    this.console.info(this.i18n.t('project.creating', { name: projectName }))

    const projectPath = path.join(this.outputDir, `daily-report-${projectName}`)

    // 1. 创建项目目录结构
    this.createProjectStructure(projectPath, projectName)

    // 2. 复制核心代码文件
    this.copyCoreFiles(projectPath)

    // 3. 生成配置文件
    this.generateConfigFiles(projectPath, projectName, options)

    // 4. 生成规范文档
    this.generateDocumentation(projectPath, projectName)

    // 5. 初始化Git仓库
    this.initGitRepository(projectPath)

    // 6. 创建GitHub仓库
    if (options.createGitHub) {
      await this.createGitHubRepository(projectName, projectPath)
    }

    this.console.success(this.i18n.t('project.created', { name: projectPath }))
    return projectPath
  }

  /**
   * 创建项目目录结构
   */
  createProjectStructure (projectPath, projectName) {
    this.console.info(this.i18n.t('scripts.creating_structure'))

    const directories = [
      'src',
      'config',
      'data',
      'output',
      'scripts',
      'docs',
      'tests',
      '.github/workflows'
    ]

    directories.forEach(dir => {
      fs.mkdirSync(path.join(projectPath, dir), { recursive: true })
    })
  }

  /**
   * 复制核心代码文件
   */
  copyCoreFiles (projectPath) {
    this.console.info(this.i18n.t('scripts.copying_files'))

    const coreFiles = [
      'index.js',
      'collector.js',
      'processor.js',
      'generator.js',
      'database.js',
      'utils.js'
    ]

    coreFiles.forEach(file => {
      // 优先从项目模板目录复制
      const templatePath = path.join(__dirname, '../templates/src', file)

      // 如果不存在，从tech-daily-digest技能目录的scripts子目录复制
      const skillPath = path.join(this.baseSkillPath, 'scripts', file)

      const destPath = path.join(projectPath, 'src', file)

      let srcPath = null
      if (fs.existsSync(templatePath)) {
        srcPath = templatePath
        this.console.success(`从模板目录复制: ${file}`)
      } else if (fs.existsSync(skillPath)) {
        srcPath = skillPath
        this.console.success(`从技能目录复制: ${file}`)
      } else {
        this.console.warn(`跳过: ${file} (源文件不存在)`)
        return
      }

      try {
        fs.copyFileSync(srcPath, destPath)
        this.console.info(`目标: src/${file}`)
      } catch (error) {
        this.console.error(`复制失败: ${file}`, error.message)
      }
    })

    // 复制package.json并修改
    const packageJson = this.createPackageJson(projectPath)
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }

  /**
   * 创建package.json
   */
  createPackageJson (projectPath) {
    const basePackagePath = path.join(this.baseSkillPath, 'package.json')
    const fallbackPackagePath = path.join(__dirname, '..', 'package.json')
    let packageJson = {}

    if (fs.existsSync(basePackagePath)) {
      packageJson = JSON.parse(fs.readFileSync(basePackagePath, 'utf8'))
    } else if (fs.existsSync(fallbackPackagePath)) {
      packageJson = JSON.parse(fs.readFileSync(fallbackPackagePath, 'utf8'))
    }

    // 确保基础字段存在
    if (!packageJson.version) {
      packageJson.version = '1.0.0'
    }
    if (!packageJson.main) {
      packageJson.main = 'src/index.js'
    }
    // 总是设置正确的scripts
    packageJson.scripts = {
      start: 'node src/index.js',
      test: 'jest',
      lint: 'eslint src/ --fix',
      setup: 'npm install && cp config/config.example.json config/config.json',
      help: 'node src/index.js --help'
    }

    // 确���dependencies字段存在
    if (!packageJson.dependencies) {
      packageJson.dependencies = {
        axios: '^1.6.0',
        commander: '^11.0.0',
        'fs-extra': '^11.3.3',
        yargs: '^18.0.0',
        sqlite3: '^5.1.6',
        'rss-parser': '^3.13.0',
        nodemailer: '^6.9.0',
        dotenv: '^16.4.0',
        chalk: '^4.1.2'
      }
    } else {
      // 确保必需的依赖存在
      const requiredDeps = {
        sqlite3: '^5.1.6',
        'rss-parser': '^3.13.0'
      }
      Object.assign(packageJson.dependencies, requiredDeps)
    }

    // 确保devDependencies字段存在
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {
        '@types/jest': '^29.5.0',
        eslint: '^8.55.0',
        'eslint-config-standard': '^17.1.0',
        'eslint-plugin-import': '^2.29.0',
        'eslint-plugin-node': '^11.1.0',
        'eslint-plugin-promise': '^6.1.0',
        inquirer: '^9.2.0',
        jest: '^29.7.0',
        supertest: '^6.3.0'
      }
    }

    // 更新项目信息
    const projectName = path.basename(projectPath).replace('daily-report-', '')
    packageJson.name = `daily-report-${projectName}`
    packageJson.description = `基于技术博客的自动化日报系统 - ${projectName}`
    packageJson.main = 'src/index.js'
    packageJson.keywords = ['daily-report', 'tech-blog', 'ai-summary', 'automation']

    return packageJson
  }

  /**
   * 生成配置文件
   */
  generateConfigFiles (projectPath, projectName, options) {
    this.console.info(this.i18n.t('scripts.generating_config'))

    // 生成package.json
    const packageJson = this.createPackageJson(projectPath)
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )

    // 1. 配置文件模板
    const configTemplate = {
      database: {
        path: './data/daily_report.db'
      },
      llm: {
        provider: options.llmProvider || 'openai',
        api_key: process.env.OPENAI_API_KEY || 'your-api-key-here',
        model: options.model || 'gpt-3.5-turbo',
        base_url: options.baseUrl || 'https://api.openai.com/v1'
      },
      digest: {
        limit_articles: options.limitArticles || 20,
        output_dir: './output',
        output_format: 'markdown'
      },
      sources: [
        {
          name: '美团技术团队',
          feed_url: 'https://tech.meituan.com/feed',
          type: 'rss',
          category: '企业技术',
          maxArticles: 20
        },
        {
          name: '字节跳动技术团队',
          feed_url: 'https://techblog.toutiao.com/rss.xml',
          type: 'rss',
          category: '企业技术',
          maxArticles: 20
        }
      ]
    }

    // 确保config目录存在
    const configDir = path.join(projectPath, 'config')
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(projectPath, 'config', 'config.example.json'),
      JSON.stringify(configTemplate, null, 2)
    )

    // 2. 数据源配置模板
    const sourcesTemplate = {
      sources: [
        {
          name: '美团技术团队',
          feed_url: 'https://tech.meituan.com/feed',
          is_active: true,
          category: '企业技术'
        },
        {
          name: '字节跳动技术团队',
          feed_url: 'https://techblog.toutiao.com/rss.xml',
          is_active: true,
          category: '企业技术'
        }
      ]
    }

    fs.writeFileSync(
      path.join(projectPath, 'config', 'sources.example.json'),
      JSON.stringify(sourcesTemplate, null, 2)
    )

    // 3. 环境变量模板
    const envTemplate = `# OpenAI API配置
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1

# 数据库配置
DB_PATH=./data/daily_report.db

# 输出配置
OUTPUT_DIR=./output
LIMIT_ARTICLES=20

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
`

    fs.writeFileSync(path.join(projectPath, '.env.example'), envTemplate)
  }

  /**
   * 生成���档
   */
  generateDocumentation (projectPath, projectName) {
    this.console.info(this.i18n.t('scripts.generating_docs'))

    // 1. README.md
    const readme = this.generateReadme(projectName)
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme)

    // 2. Agent.md (仓库规范)
    const agentMd = this.generateAgentMd()
    fs.writeFileSync(path.join(projectPath, 'Agent.md'), agentMd)

    // 3. SKILL.md (技能描述)
    this.copySkillMd(projectPath, projectName)

    // 4. .gitignore
    const gitignore = this.generateGitignore()
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore)

    // 5. GitHub Actions
    this.createGitHubActions(projectPath)
  }

  /**
   * 生成README.md
   */
  generateReadme (projectName) {
    return `# Daily Report - ${projectName}

> 📰 基于AI摘要的技术博客自动化日报系统

## 🎯 项目特色

- **智能采集**: 自动采集多个技术博客的最新文章
- **AI摘要**: 使用人工智能生成文章核心观点摘要
- **去重机制**: 基于文章链接的智能去重
- **模板化输出**: 支持Markdown、HTML等多种输出格式
- **轻量部署**: 基于SQLite，支持Docker部署

## 🚀 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境

\`\`\`bash
# 复制配置文件
cp config/config.example.json config/config.json
cp config/sources.example.json config/sources.json
cp .env.example .env

# 编辑配置文件，设置API密钥和数据源
vim .env
\`\`\`

### 3. 运行系统

\`\`\`bash
# 完整流程
npm start

# 或者分步执行
npm run collect    # 采集文章
npm run process    # 处理文章
npm run digest     # 生成日报
\`\`\`

## 📁 项目结构

\`\`\`
daily-report-${projectName}/
├��─ src/                 # 源代码
│   ├── index.js        # 主入口
│   ├── collector.js    # 文章采集器
│   ├── processor.js    # 文章处理器
│   ├── generator.js    # 日报生成器
│   └── database.js     # 数据库操作
├── config/              # 配置文件
├── data/                # 数据目录
├── output/              # 输出目录
├── scripts/             # 工具脚本
├── docs/                # 文档
└── .github/workflows/   # CI/CD配置
\`\`\`

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| OPENAI_API_KEY | OpenAI API密钥 | sk-... |
| DB_PATH | 数据库文件路径 | ./data/daily_report.db |
| LIMIT_ARTICLES | 每日文章限制 | 20 |

### 数据源配置

在 \`config/sources.json\` 中配置RSS源：

\`\`\`json
{
  "sources": [
    {
      "name": "技术博客名称",
      "feed_url": "https://example.com/rss.xml",
      "is_active": true,
      "category": "分类"
    }
  ]
}
\`\`\`

## 🐳 Docker部署

\`\`\`bash
# 构建镜像
docker build -t daily-report-${projectName} .

# 运行容器
docker run -d \\
  --name daily-report-${projectName} \\
  -v ./data:/app/data \\
  -v ./output:/app/output \\
  -e OPENAI_API_KEY=your-api-key \\
  daily-report-${projectName}
\`\`\`

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 \`git checkout -b feature/AmazingFeature\`
3. 提交更改 \`git commit -m 'Add some AmazingFeature'\`
4. 推送到分支 \`git push origin feature/AmazingFeature\`
5. 开启 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**📝 让技术阅读更高效，让信息获取更智能**
`
  }

  /**
   * 生成Agent.md仓库规范
   */
  generateAgentMd () {
    // 复制Agent.md模板并简化
    return `# Agent.md — 仓库文档与数据上传规范

## 项目规范

本项目遵循以下规范：

### ✅ 允许上传
- 源代码文件 (*.js, *.json)
- 配置模板 (*.example)
- 文档文件 (README.md, docs/**)
- CI/CD配置 (.github/**)

### ❌ 禁止上传
- 配置文件含API密钥的
- 数据库文件 (*.db, *.sqlite)
- 日志文件 (*.log)
- 临时文件和缓存
- 个人配置文件

### 🔄 自动化规则
- 配置文件使用模板形式
- API密钥使用环境变量
- 数据目录在.gitignore中排除
- 输出文件定期清理

## 提交前检查

- [ ] 无敏感信息泄露
- [ ] 配置文件使用模板
- [ ] 代码格式规范
- [ ] 文档更新及时

---

**保持仓库整洁，只上传必要的项目资产**
`
  }

  /**
   * 生成.gitignore
   */
  generateGitignore () {
    return `# 依赖
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 环境配置
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 数据文件
*.db
*.sqlite
*.sqlite3
data/

# 输出文件
output/
*.html
*.pdf
digest-*.md

# 日志文件
logs/
*.log

# 临时文件
tmp/
cache/
.DS_Store
Thumbs.db

# 编辑器
.vscode/
.idea/
*.swp
*.swo

# 系统文件
dist/
build/
coverage/
.nyc_output/
`
  }

  /**
   * 复制SKILL.md文件
   */
  copySkillMd (projectPath, projectName) {
    try {
      const skillMdPath = path.join(__dirname, '..', 'SKILL.md')
      if (fs.existsSync(skillMdPath)) {
        let skillMdContent = fs.readFileSync(skillMdPath, 'utf8')

        // 替换项目名称
        skillMdContent = skillMdContent.replace(/日报项目创建器/g, `日报项目 - ${projectName}`)
        skillMdContent = skillMdContent.replace(/daily-report-project-creator/g, `daily-report-${projectName}`)

        fs.writeFileSync(path.join(projectPath, 'SKILL.md'), skillMdContent)
        this.console.success(this.i18n.t('scripts.skill_copied'))
      } else {
        // 如果SKILL.md不存在，生成一个基本的
        const basicSkillMd = this.generateBasicSkillMd(projectName)
        fs.writeFileSync(path.join(projectPath, 'SKILL.md'), basicSkillMd)
        this.console.success(this.i18n.t('scripts.skill_generated'))
      }
    } catch (error) {
      this.console.error(this.i18n.t('scripts.skill_failed', { error: error.message }))
    }
  }

  /**
   * 生成基本的SKILL.md
   */
  generateBasicSkillMd (projectName) {
    return `# SKILL.md — daily-report-${projectName}

## Description

基于AI摘要的技术博客自动化日报系统 - ${projectName}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
node index.js
\`\`\`

## Configuration

复制 \`config/config.example.json\` 为 \`config/config.json\` 并配置必要参数。

## Features

- 智能采集技术博客文章
- AI生成文章摘要
- 自动去除重复内容
- 支持多种输出格式
- 轻量级部署方案

## Repository

- URL: https://github.com/yang9112/daily-report-${projectName}
- Default branch: master
- Main language: JavaScript
`
  }

  /**
   * 创建GitHub Actions
   */
  createGitHubActions (projectPath) {
    const workflowDir = path.join(projectPath, '.github', 'workflows')

    // Daily digest workflow
    const dailyWorkflow = `name: Daily Digest Generator

on:
  schedule:
    # 每天9点UTC运行 (17点北京)
    - cron: '0 9 * * *'
  workflow_dispatch: # 允许手动触发

jobs:
  generate-digest:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Generate daily digest
      run: npm start
      env:
        OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
        OPENAI_BASE_URL: \${{ secrets.OPENAI_BASE_URL }}
        
    - name: Commit and push if changed
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add output/
        if git diff --staged --quiet; then
          echo "No changes to commit"
        else
          git commit -m "🤖 Auto-generate daily digest - $(date +'%Y-%m-%d')"
          git push
        fi
`

    fs.writeFileSync(path.join(workflowDir, 'daily-digest.yml'), dailyWorkflow)

    // CI workflow
    const ciWorkflow = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Lint code
      run: npm run lint
  validate:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Validate project
      run: npm run validate
`

    fs.writeFileSync(path.join(workflowDir, 'ci.yml'), ciWorkflow)
  }

  /**
   * 初始化Git仓库
   */
  initGitRepository (projectPath) {
    this.console.info(this.i18n.t('scripts.init_git'))

    try {
      // 使用 --quiet ���数来抑制Git警告
      const gitOptions = { cwd: projectPath, stdio: process.env.NODE_ENV === 'test' ? 'pipe' : 'inherit' }

      execSync('git init --quiet', gitOptions)
      execSync('git config user.email "test@example.com"', gitOptions)
      execSync('git config user.name "Test User"', gitOptions)
      execSync('git add .', gitOptions)
      execSync('git commit -m "🎉 初始化日报项目"', gitOptions)
      this.console.success(this.i18n.t('scripts.git_init_success'))
    } catch (error) {
      this.console.error(this.i18n.t('scripts.git_init_failed', { error: error.message }))
    }
  }

  /**
   * 创建GitHub仓库
   */
  async createGitHubRepository (projectName, projectPath) {
    this.console.info(this.i18n.t('scripts.creating_github'))

    const repoName = `daily-report-${projectName}`

    try {
      // 使用gh CLI创建仓库
      execSync(`gh repo create ${repoName} --public --description="基于AI摘要的技术博客自动化日报系统" --clone=false`,
        { stdio: 'inherit' })

      // 添加远程仓库并推送
      execSync(`git remote add origin https://github.com/yang9112/${repoName}.git`,
        { cwd: projectPath })
      // 尝试推送到main分支，如果失败则推送到master分支
      try {
        execSync('git push -u origin main', { cwd: projectPath })
      } catch (pushError) {
        this.console.warn('推送到main分支失败，尝试推送到master分支...')
        execSync('git push -u origin master', { cwd: projectPath })
      }

      this.console.success(`GitHub仓库创建成功: https://github.com/yang9112/${repoName}`)
    } catch (error) {
      this.console.error(this.i18n.t('scripts.github_failed', { error: error.message }))
      this.console.info(`请手动创建仓库: gh repo create ${repoName} --public`)
    }
  }
}

// 命令行接口
if (require.main === module) {
  const program = new Command()

  program
    .name('daily-report-create')
    .description('创建新的日报项目')
    .version('1.0.0')
    .argument('<project-name>', '项目名称')
    .option('-l, --lang <language>', '指定语言 (zh-CN, en-US, ja-JP, ko-KR)', 'zh-CN')
    .option('-t, --theme <theme>', '指定主题 (default, minimal, vibrant, professional, dark, colorful)', 'default')
    .option('--no-github', '不创建GitHub仓库')
    .action((projectName, options) => {
      // 检查是否为帮助请求
      if (projectName && (projectName === 'help' || projectName === '--help' || projectName === '-h')) {
        program.outputHelp()
        return
      }

      // 设置语言
      i18n.setLocale(options.lang)

      const creator = new DailyReportProjectCreator(i18n, options.theme)
      creator.createProject(projectName, { createGitHub: options.github })
        .then(() => {
          creator.console.success(i18n.t('project.creation_complete'))
        })
        .catch(error => {
          creator.console.error(i18n.t('error.creation_failed', { error: error.message }))
          process.exit(1)
        })
    })

  program.parse()
}

module.exports = DailyReportProjectCreator
