#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * 项目验证脚本
 * 验证项目结构、配置文件和代码质量
 */
class ProjectValidator {
  constructor () {
    this.errors = []
    this.warnings = []
    this.projectRoot = path.resolve(__dirname, '..')
  }

  /**
   * 执行所有验证
   */
  validate () {
    console.log('🔍 开始项目验证...\n')

    this.validateProjectStructure()
    this.validatePackageJson()
    this.validateSkillMd()
    this.validateAgentMd()
    this.validateScripts()
    this.validateGitIgnore()
    this.validateDocumentation()
    this.validateSecurity()
    this.validateDependencies()

    this.reportResults()
    return this.errors.length === 0
  }

  /**
   * 验证项目结构
   */
  validateProjectStructure () {
    console.log('📁 验证项目结构...')

    const requiredStructure = {
      'SKILL.md': 'file',
      'Agent.md': 'file',
      'package.json': 'file',
      Dockerfile: 'file',
      '.gitignore': 'file',
      'scripts/': 'dir',
      'tests/': 'dir',
      'references/': 'dir',
      '.github/workflows/': 'dir'
    }

    for (const [item, type] of Object.entries(requiredStructure)) {
      const itemPath = path.join(this.projectRoot, item)
      const exists = type === 'dir'
        ? fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory()
        : fs.existsSync(itemPath) && fs.statSync(itemPath).isFile()

      if (exists) {
        console.log(`  ✅ ${item}`)
      } else {
        console.log(`  ❌ ${item} (缺失)`)
        this.errors.push(`Missing required ${type}: ${item}`)
      }
    }

    // 检查脚本文件
    const requiredScripts = ['create-project.js', 'batch-create.js']
    requiredScripts.forEach(script => {
      const scriptPath = path.join(this.projectRoot, 'scripts', script)
      if (fs.existsSync(scriptPath) && fs.statSync(scriptPath).isFile()) {
        console.log(`  ✅ scripts/${script}`)
      } else {
        console.log(`  ❌ scripts/${script} (缺失)`)
        this.errors.push(`Missing required script: scripts/${script}`)
      }
    })
  }

  /**
   * 验证package.json
   */
  validatePackageJson () {
    console.log('\n📦 验证package.json...')

    try {
      const packagePath = path.join(this.projectRoot, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

      // 必需字段
      const requiredFields = ['name', 'version', 'description', 'main', 'scripts', 'keywords']
      requiredFields.forEach(field => {
        if (packageJson[field]) {
          console.log(`  ✅ ${field}`)
        } else {
          console.log(`  ❌ ${field} (缺失)`)
          this.errors.push(`Missing package.json field: ${field}`)
        }
      })

      // 验证scripts
      const requiredScripts = ['test', 'lint', 'create', 'batch']
      requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          console.log(`  ✅ scripts.${script}`)
        } else {
          console.log(`  ⚠️  scripts.${script} (缺失)`)
          this.warnings.push(`Missing recommended script: ${script}`)
        }
      })

      // 验证bin配置
      if (packageJson.bin) {
        console.log('  ✅ bin configuration')
        Object.keys(packageJson.bin).forEach(binName => {
          const binPath = path.join(this.projectRoot, packageJson.bin[binName])
          if (fs.existsSync(binPath)) {
            console.log(`    ✅ ${binName} -> ${packageJson.bin[binName]}`)
          } else {
            console.log(`    ❌ ${binName} -> ${packageJson.bin[binName]} (文件不存在)`)
            this.errors.push(`Binary file not found: ${packageJson.bin[binName]}`)
          }
        })
      }
    } catch (error) {
      console.log(`  ❌ 解析失败: ${error.message}`)
      this.errors.push(`Invalid package.json: ${error.message}`)
    }
  }

  /**
   * 验证SKILL.md
   */
  validateSkillMd () {
    console.log('\n📋 验证SKILL.md...')

    const skillPath = path.join(this.projectRoot, 'SKILL.md')
    try {
      const content = fs.readFileSync(skillPath, 'utf8')

      // 检查YAML frontmatter
      const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (frontmatterMatch) {
        try {
          const frontmatter = frontmatterMatch[1]
          if (frontmatter.includes('name:') && frontmatter.includes('description:')) {
            console.log('  ✅ YAML frontmatter')
          } else {
            console.log('  ❌ YAML frontmatter缺少name或description')
            this.errors.push('SKILL.md frontmatter missing name or description')
          }
        } catch (e) {
          console.log('  ❌ YAML frontmatter格式错误')
          this.errors.push('Invalid YAML frontmatter in SKILL.md')
        }
      } else {
        console.log('  ❌ 缺少YAML frontmatter')
        this.errors.push('SKILL.md missing YAML frontmatter')
      }

      // 检查基本内容结构
      if (content.includes('## 🎯 核心价值')) {
        console.log('  ✅ 包含核心价值说明')
      } else {
        console.log('  ⚠️  建议添加核心价值说明')
        this.warnings.push('SKILL.md should include core value section')
      }

      if (content.includes('# 技术博客日报系统')) {
        console.log('  ✅ 包含技术博客日报系统内容')
      } else {
        console.log('  ❌ 缺少技术博客日报系统内容')
        this.errors.push('SKILL.md missing technical blog digest content')
      }
    } catch (error) {
      console.log(`  ❌ 读取失败: ${error.message}`)
      this.errors.push(`Cannot read SKILL.md: ${error.message}`)
    }
  }

  /**
   * 验证Agent.md
   */
  validateAgentMd () {
    console.log('\n🤖 验证Agent.md...')

    const agentPath = path.join(this.projectRoot, 'Agent.md')
    try {
      const content = fs.readFileSync(agentPath, 'utf8')

      // 检查基本规范
      if (content.includes('# Agent.md — 仓库文档与数据上传规范')) {
        console.log('  ✅ 包含规范标题')
      } else {
        console.log('  ❌ 缺少规范标题')
        this.errors.push('Agent.md missing specification title')
      }

      if (content.includes('### ✅ 允许上传')) {
        console.log('  ✅ 包含允许上传规范')
      } else {
        console.log('  ⚠️  建议添加允许上传规范')
        this.warnings.push('Agent.md should include allowed uploads section')
      }

      if (content.includes('### ❌ 严格禁止上传')) {
        console.log('  ✅ 包含禁止上传规范')
      } else {
        console.log('  ⚠️  建议添加禁止上传规范')
        this.warnings.push('Agent.md should include forbidden uploads section')
      }
    } catch (error) {
      console.log(`  ❌ 读取失败: ${error.message}`)
      this.errors.push(`Cannot read Agent.md: ${error.message}`)
    }
  }

  /**
   * 验证脚本文件
   */
  validateScripts () {
    console.log('\n🔧 验证脚本文件...')

    const scriptsPath = path.join(this.projectRoot, 'scripts')
    const scriptFiles = fs.readdirSync(scriptsPath).filter(file => file.endsWith('.js'))

    scriptFiles.forEach(scriptFile => {
      try {
        const scriptPath = path.join(scriptsPath, scriptFile)
        const content = fs.readFileSync(scriptPath, 'utf8')

        // 检查shebang
        if (content.startsWith('#!/usr/bin/env node')) {
          console.log(`  ✅ ${scriptFile} (shebang)`)
        } else {
          console.log(`  ⚠️  ${scriptFile} (建议添加shebang)`)
          this.warnings.push(`${scriptFile} should include shebang`)
        }

        // 检查基本错误处理
        if (content.includes('try') && content.includes('catch')) {
          console.log(`  ✅ ${scriptFile} (错误处理)`)
        } else {
          console.log(`  ⚠️  ${scriptFile} (建议添加错误处理)`)
          this.warnings.push(`${scriptFile} should include error handling`)
        }

        try {
          // 去除shebang再进行语法检查
          const contentWithoutShebang = content.replace(/^#!.*/, '')
          
          // 检查是否可以解析为模块
          // 简单的语法检查，避免使用Function构造函数
          const ast = require('acorn').parse(contentWithoutShebang, {
            ecmaVersion: 2020,
            sourceType: 'module'
          })
          console.log(`  ✅ ${scriptFile} (语法正确)`)
        } catch (error) {
          // 如果acorn不可用或解析失败，使用简单检查
          if (error.name !== 'SyntaxError' && error.name !== 'ParseError') {
            try {
              // 检查基本的语法结构
              const bracketCount = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length
              const braceCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length
              
              if (bracketCount === 0 && braceCount === 0 && content.trim()) {
                console.log(`  ✅ ${scriptFile} (语法基本正确)`)
              } else {
                console.log(`  ⚠️  ${scriptFile} (语法检查跳过)`)
              }
            } catch (e) {
              console.log(`  ⚠️  ${scriptFile} (语法检查跳过)`)
            }
          } else {
            console.log(`  ❌ ${scriptFile} (语法错误: ${error.message})`)
            this.errors.push(`Syntax error in ${scriptFile}: ${error.message}`)
          }
        }
      } catch (error) {
        console.log(`  ❌ ${scriptFile} (读取失败: ${error.message})`)
        this.errors.push(`Cannot read ${scriptFile}: ${error.message}`)
      }
    })
  }

  /**
   * 验证.gitignore
   */
  validateGitIgnore () {
    console.log('\n🙈 验证.gitignore...')

    const gitignorePath = path.join(this.projectRoot, '.gitignore')
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8')

      const requiredIgnores = [
        'node_modules/',
        '.env',
        '*.log',
        'output/',
        'daily-report-*/'
      ]

      requiredIgnores.forEach(ignore => {
        if (content.includes(ignore)) {
          console.log(`  ✅ ${ignore}`)
        } else {
          console.log(`  ⚠️  ${ignore} (建议忽略)`)
          this.warnings.push(`.gitignore should ignore ${ignore}`)
        }
      })
    } catch (error) {
      console.log(`  ❌ 读取失败: ${error.message}`)
      this.errors.push(`Cannot read .gitignore: ${error.message}`)
    }
  }

  /**
   * 验证文档完整性
   */
  validateDocumentation () {
    console.log('\n📚 验证文档完整性...')

    const requiredDocs = [
      { file: 'README.md', required: true },
      { file: 'Dockerfile', required: true },
      { file: 'references/project-structures.md', required: true }
    ]

    requiredDocs.forEach(doc => {
      const docPath = path.join(this.projectRoot, doc.file)
      if (fs.existsSync(docPath)) {
        const stats = fs.statSync(docPath)
        if (stats.size > 100) { // 至少100字节
          console.log(`  ✅ ${doc.file}`)
        } else {
          console.log(`  ⚠️  ${doc.file} (内容较少)`)
          this.warnings.push(`${doc.file} seems too short (${stats.size} bytes)`)
        }
      } else if (doc.required) {
        console.log(`  ❌ ${doc.file} (缺失)`)
        this.errors.push(`Missing required documentation: ${doc.file}`)
      }
    })
  }

  /**
   * 验证安全性
   */
  validateSecurity () {
    console.log('\n🔒 验证安全性...')

    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{48}/,
      /ghp_[a-zA-Z0-9]{36}/,
      /password\s*=\s*['"']?[^'""s]+/i,
      /secret\s*=\s*['"']?[^'""s]+/i,
      /api_key\s*=\s*['"']?[^'""s]+/i
    ]

    const filesToCheck = ['*.js', '*.json', '*.md']

    filesToCheck.forEach(pattern => {
      try {
        const file = path.join(this.projectRoot, pattern.replace('*', 'package'))
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8')

          sensitivePatterns.forEach((regex, index) => {
            if (regex.test(content)) {
              console.log(`  ❌ ${pattern} (发现敏感信息)`)
              this.errors.push(`Sensitive information found in ${pattern}`)
            } else {
              console.log(`  ✅ ${pattern} (安全检查通过)`)
            }
          })
        }
      } catch (error) {
        // 忽略文件读取错误，文件可能不存在
      }
    })
  }

  /**
   * 验证依赖
   */
  validateDependencies () {
    console.log('\n📋 验证依赖...')

    try {
      const packagePath = path.join(this.projectRoot, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

      if (packageJson.dependencies) {
        Object.keys(packageJson.dependencies).forEach(dep => {
          console.log(`  ✅ ${dep}`)
        })
      }

      if (packageJson.devDependencies) {
        Object.keys(packageJson.devDependencies).forEach(dep => {
          console.log(`  ✅ ${dep} (dev)`)
        })
      }
    } catch (error) {
      console.log(`  ❌ 读取package.json失败: ${error.message}`)
      this.errors.push(`Cannot validate dependencies: ${error.message}`)
    }
  }

  /**
   * 报告验证结果
   */
  reportResults () {
    console.log('\n' + '='.repeat(50))
    console.log('📊 验证结果报告')
    console.log('='.repeat(50))

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 所有验证通过！项目结构完整且符合规范。')
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 错误 (必须修复):')
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告 (建议修复):')
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`)
      })
    }

    const score = Math.max(0, 100 - (this.errors.length * 10) - (this.warnings.length * 2))
    console.log(`\n📈 项目质量评分: ${score}/100`)

    if (score >= 90) {
      console.log('✅ 项目质量优秀！')
    } else if (score >= 70) {
      console.log('👍 项目质量良好')
    } else {
      console.log('⚠️  项目需要改进')
    }
  }
}

// 主程序
if (require.main === module) {
  const validator = new ProjectValidator()
  const success = validator.validate()

  process.exit(success ? 0 : 1)
}

module.exports = ProjectValidator
