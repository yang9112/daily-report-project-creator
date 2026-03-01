#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * 基于tech-daily-digest创建新的日报项目
 */
class DailyReportProjectCreator {
  constructor () {
    this.baseSkillPath = path.join(__dirname, '../templates')
    this.outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output')
  }

  /**
   * 创建新项目
   */
  async createProject (projectName, options = {}) {
    console.log(`🚀 创建日报项目: ${projectName}`)

    // 验证项目名称
    if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
      throw new Error('项目名称不能为空')
    }

    // 支持自定义输出目录
    this.outputDir = options.outputDir || this.outputDir

    const projectPath = path.join(this.outputDir, `daily-report-${projectName}`)

    // 1. 创建项目目录结构
    // 1. 创建项目根目录
    fs.mkdirSync(projectPath, { recursive: true })

    // 2. 创建项目目录结构
    this.createProjectStructure(projectPath, projectName)

    // 3. 复制核心代码文件
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

    console.log(`✅ 项目创建完成: ${projectPath}`)
    return projectPath
  }

  /**
   * 创建项目目录结构
   */
  createProjectStructure (projectPath, projectName) {
    console.log('📁 创建项目目录结构...')

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
      const fullPath = path.join(projectPath, dir)
      this.ensureDirExists(fullPath)
    })
  }

  /**
   * 确保目录存在
   */
  ensureDirExists (dirPath) {
    try {
      fs.mkdirSync(dirPath, { recursive: true })
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }

  /**
   * 复制核心代码文件
   */
  copyCoreFiles (projectPath) {
    console.log('📋 复制核心代码文件...')

    const coreFiles = [
      'index.js',
      'collector.js',
      'processor.js',
      'generator.js',
      'database.js',
      'utils.js'
    ]

    coreFiles.forEach(file => {
      const srcPath = path.join(this.baseSkillPath, file)
      const destPath = path.join(projectPath, 'src', file)

      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath)
        console.log(`  ✅ 复制: ${file}`)
      } else {
        console.log(`  ⚠️  跳过: ${file} (文件不存在)`)
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
    let packageJson = {}

    if (fs.existsSync(basePackagePath)) {
      packageJson = JSON.parse(fs.readFileSync(basePackagePath, 'utf8'))
    }

    // 更新项目信息
    const projectName = path.basename(projectPath).replace('daily-report-', '')
    packageJson.name = `daily-report-${projectName}`
    packageJson.description = `基于技术博客的自动化日报系统 - ${projectName}`
    packageJson.keywords = ['daily-report', 'tech-blog', 'ai-summary', 'automation']

    return packageJson
  }

  /**
   * 生成配置文件
   */
  generateConfigFiles (projectPath, projectName, options) {
    console.log('⚙️ 生成配置文件...')

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
      sources: {
        auto_discover: true,
        default_feeds: [
          {
            name: '示例技术博客',
            feed_url: 'https://example.com/rss.xml',
            is_active: true
          }
        ]
      }
    }

    const configDir = path.join(projectPath, 'config')
    this.ensureDirExists(configDir)
    fs.writeFileSync(
      path.join(configDir, 'config.example.json'),
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
   * 生成文档
   */
  generateDocumentation (projectPath, projectName) {
    console.log('📚 生成项目文档...')

    // 1. README.md
    const readme = this.generateReadme(projectName)
    const readmePath = path.join(projectPath, 'README.md')
    this.ensureDirExists(path.dirname(readmePath))
    fs.writeFileSync(readmePath, readme)

    // 2. SKILL.md (技能描述)
    const skillMd = this.generateSkillMd(projectName)
    fs.writeFileSync(path.join(projectPath, 'SKILL.md'), skillMd)

    // 3. Agent.md (仓库规范)
    const agentMd = this.generateAgentMd()
    fs.writeFileSync(path.join(projectPath, 'Agent.md'), agentMd)

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
   * 生成SKILL.md
   */
  generateSkillMd (projectName) {
    return `---
name: daily-report-${projectName}
description: 基于${projectName}的AI驱动技术博客自动化日报系统
---

# 技术博客日报系统 (${projectName}) 📰

## 🎯 核心价值
基于KISS原则设计的技术博客自动采集和AI摘要系统，每日生成高质量技术阅读简报。

## 🚀 核心特性
- **轻量级架构**: SQLite数据库，零配置部署
- **智能去重**: 基于文章链接自动去重
- **AI摘要**: 自动提取核心观点和关键词
- **模块化设计**: 采集、处理、分发解耦
- **容错机制**: 单源失败不影响整体运行

## 🏗️ 系统架构
\`\`\`
配置文件 → 采集器 → SQLite数据库 → 处理器 → AI摘要 → 日报生成
\`\`\`

## 🛠️ 使用方法

### 1. 初始化配置
\`\`\`bash
npm install
node setup.js
cp config/sources.example.json config/sources.json
\`\`\`

### 2. 配置AI服务
\`\`\`bash
cp config/config.example.json config/config.json
# 设置你的OpenAI/DeepSeek API密钥
\`\`\`

### 3. 运行系统
\`\`\`bash
npm start
\`\`\`

## 📋 配置说明

### config/sources.json - RSS源配置
\`\`\`json
{
  "sources": [
    {
      "name": "技术博客",
      "url": "https://example.com/rss",
      "category": "技术"
    }
  ]
}
\`\`\`

### config/config.json - 系统配置
\`\`\`json
{
  "ai": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "apiKey": "your-api-key"
  }
}
\`\`\`

## 📁 项目结构
\`\`\`
daily-report-${projectName}/
├── src/
│   ├── collector.js     # RSS采集器
│   ├── processor.js     # AI处理器
│   ├── generator.js     # 日报生成器
│   └── database.js      # 数据库操作
├── config/              # 配置文件
├── output/              # 生成的日报
└── package.json
\`\`\`

## 📄 许可证
本项目采用 MIT 许可证
`
  }

  /**
   * 创建GitHub Actions
   */
  createGitHubActions (projectPath) {
    const workflowDir = path.join(projectPath, '.github', 'workflows')
    this.ensureDirExists(workflowDir)

    // Daily digest workflow
    const dailyWorkflowStr = `name: Daily Digest Generator

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

    fs.writeFileSync(path.join(workflowDir, 'daily-digest.yml'), dailyWorkflowStr)

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
`

    fs.writeFileSync(path.join(workflowDir, 'ci.yml'), ciWorkflow)
  }

  /**
   * 初始化Git仓库
   */
  initGitRepository (projectPath) {
    console.log('🔧 初始化Git仓库...')

    try {
      execSync('git init', { cwd: projectPath })
      execSync('git add .', { cwd: projectPath })
      execSync('git commit -m "🎉 初始化日报项目"', { cwd: projectPath })
      console.log('  ✅ Git仓库初始化完成')
    } catch (error) {
      console.log('  ⚠️ Git初始化失败:', error.message)
    }
  }

  /**
   * 创建GitHub仓库
   */
  async createGitHubRepository (projectName, projectPath) {
    console.log('🌐 创建GitHub仓库...')

    const repoName = `daily-report-${projectName}`

    try {
      // 使用gh CLI创建仓库
      execSync(`gh repo create ${repoName} --public --description="基于AI摘要的技术博客自动化日报系统" --clone=false`,
        { stdio: 'inherit' })

      // 添加远程仓库并推送
      execSync(`git remote add origin https://github.com/yang9112/${repoName}.git`,
        { cwd: projectPath })
      execSync('git push -u origin main', { cwd: projectPath })

      console.log(`  ✅ GitHub仓库创建成功: https://github.com/yang9112/${repoName}`)
    } catch (error) {
      console.log('  ⚠️ GitHub仓库创建失败:', error.message)
      console.log(`  💡 请手动创建仓库: gh repo create ${repoName} --public`)
    }
  }
}

// 命令行接口
if (require.main === module) {
  const { Command } = require('commander')
  const program = new Command()

  program
    .name('create-project')
    .description('创建日报项目')
    .version('1.0.0')

  program
    .argument('<project-name>', '项目名称')
    .option('--no-github', '不创建GitHub仓库')
    .option('--output-dir <path>', '指定输出目录')
    .action(async (projectName, options) => {
      const creator = new DailyReportProjectCreator()
      if (!projectName || projectName.trim() === '') {
        console.error('❌ 项目名称不能为空')
        process.exit(1)
      }
      creator.createProject(projectName, {
        createGitHub: options.github !== false,
        outputDir: options.outputDir
      })
        .then(() => {
          console.log('🎉 项目创建完成！')
        })
        .catch(error => {
          console.error('❌ 项目创建失败:', error)
          process.exit(1)
        })
    })

  program.parse()
}

module.exports = DailyReportProjectCreator
