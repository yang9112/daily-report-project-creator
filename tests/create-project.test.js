const fs = require('fs')
const path = require('path')
const DailyReportProjectCreator = require('../scripts/create-project')

// 测试环境配置
const TEST_OUTPUT_DIR = '/tmp/daily-report-test'

describe('DailyReportProjectCreator', () => {
  let creator

  beforeEach(() => {
    creator = new DailyReportProjectCreator()
    // 设置测试输出目录
    creator.outputDir = TEST_OUTPUT_DIR

    // 清理测试目录
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
  })

  describe('createProjectStructure', () => {
    test('应该创建所有必需的目录', () => {
      const projectName = 'test-project'
      const projectPath = path.join(TEST_OUTPUT_DIR, `daily-report-${projectName}`)

      creator.createProjectStructure(projectPath, projectName)

      // 验证目录是否创建
      const expectedDirs = [
        'src',
        'config',
        'data',
        'output',
        'scripts',
        'docs',
        'tests',
        '.github/workflows'
      ]

      expectedDirs.forEach(dir => {
        const dirPath = path.join(projectPath, dir)
        expect(fs.existsSync(dirPath)).toBe(true)
        expect(fs.statSync(dirPath).isDirectory()).toBe(true)
      })
    })

    test('应该正确处理项目名称', () => {
      const projectName = 'awesome-report'
      const projectPath = path.join(TEST_OUTPUT_DIR, `daily-report-${projectName}`)

      creator.createProjectStructure(projectPath, projectName)

      expect(fs.existsSync(projectPath)).toBe(true)
    })
  })

  describe('createPackageJson', () => {
    test('应该生成正确的package.json', () => {
      const projectPath = path.join(TEST_OUTPUT_DIR, 'daily-report-test')
      const packageJson = creator.createPackageJson(projectPath)

      expect(packageJson.name).toBe('daily-report-test')
      expect(packageJson.description).toContain('技术博客的自动化日报系统')
      expect(packageJson.keywords).toContain('daily-report')
      expect(packageJson.keywords).toContain('tech-blog')
    })

    test('应该包含必需的字段', () => {
      const projectPath = path.join(TEST_OUTPUT_DIR, 'daily-report-test')
      const packageJson = creator.createPackageJson(projectPath)

      expect(packageJson).toHaveProperty('name')
      expect(packageJson).toHaveProperty('version')
      expect(packageJson).toHaveProperty('description')
      expect(packageJson).toHaveProperty('main')
      expect(packageJson).toHaveProperty('scripts')
      expect(packageJson).toHaveProperty('keywords')
    })
  })

  describe('generateConfigFiles', () => {
    test('应该生成配置文件模板', () => {
      const projectPath = path.join(TEST_OUTPUT_DIR, 'daily-report-test')
      const projectName = 'test'

      creator.generateConfigFiles(projectPath, projectName, {})

      // 验证配置文件是否存在
      expect(fs.existsSync(path.join(projectPath, 'config', 'config.example.json'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'config', 'sources.example.json'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, '.env.example'))).toBe(true)
    })

    test('配置文件应该包含正确的内容', () => {
      const projectPath = path.join(TEST_OUTPUT_DIR, 'daily-report-test')
      const projectName = 'test'

      creator.generateConfigFiles(projectPath, projectName, {})

      // 验证config.example.json
      const configContent = JSON.parse(fs.readFileSync(
        path.join(projectPath, 'config', 'config.example.json'), 'utf8'
      ))
      expect(configContent.database).toBeDefined()
      expect(configContent.llm).toBeDefined()
      expect(configContent.digest).toBeDefined()

      // 验证env.example
      const envContent = fs.readFileSync(path.join(projectPath, '.env.example'), 'utf8')
      expect(envContent).toContain('OPENAI_API_KEY')
      expect(envContent).toContain('DB_PATH')
    })
  })

  describe('generateDocumentation', () => {
    test('应该生成所有必需的文档', () => {
      const projectPath = path.join(TEST_OUTPUT_DIR, 'daily-report-test')
      const projectName = 'test'

      creator.generateDocumentation(projectPath, projectName)

      // 验证文档文件
      expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'Agent.md'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, '.gitignore'))).toBe(true)
    })

    test('README.md应该包含项目名称', () => {
      const projectPath = path.join(TEST_OUTPUT_DIR, 'daily-report-test')
      const projectName = 'test'

      creator.generateDocumentation(projectPath, projectName)

      const readmeContent = fs.readFileSync(path.join(projectPath, 'README.md'), 'utf8')
      expect(readmeContent).toContain(`Daily Report - ${projectName}`)
    })

    test('应该创建GitHub Actions工作流', () => {
      const projectPath = path.join(TEST_OUTPUT_DIR, 'daily-report-test')
      const projectName = 'test'

      creator.generateDocumentation(projectPath, projectName)

      expect(fs.existsSync(path.join(projectPath, '.github', 'workflows', 'daily-digest.yml'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, '.github', 'workflows', 'ci.yml'))).toBe(true)
    })
  })

  describe('createProject', () => {
    test('应该创建完整的项目结构', async () => {
      const projectName = 'integration-test'
      const options = { createGitHub: false } // 避免创建GitHub仓库

      const projectPath = await creator.createProject(projectName, options)

      // 验证基本结构
      expect(fs.existsSync(projectPath)).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'SKILL.md'))).toBe(true)
      expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true)
    })

    test('应该应用自定义选项', async () => {
      const projectName = 'custom-test'
      const options = {
        llmProvider: 'deepseek',
        model: 'deepseek-chat',
        limitArticles: 15,
        createGitHub: false
      }

      const projectPath = await creator.createProject(projectName, options)

      // 验证配置文件中的自定义选项
      const configContent = JSON.parse(fs.readFileSync(
        path.join(projectPath, 'config', 'config.example.json'), 'utf8'
      ))
      expect(configContent.llm.provider).toBe('deepseek')
      expect(configContent.llm.model).toBe('deepseek-chat')
      expect(configContent.digest.limit_articles).toBe(15)
    })
  })

  describe('错误处理', () => {
    test('应该处理无效的项目名称', async () => {
      const projectName = ''

      await expect(creator.createProject(projectName)).rejects.toThrow()
    })

    test('应该处理文件系统错误', async () => {
      // 模拟文件系统错误
      const originalMkdir = fs.mkdirSync
      fs.mkdirSync = jest.fn(() => {
        throw new Error('Permission denied')
      })

      try {
        await expect(creator.createProject('test')).rejects.toThrow()
      } finally {
        // 恢复原始函数
        fs.mkdirSync = originalMkdir
      }
    })
  })
})

// 性能测试
describe('Performance Tests', () => {
  test('项目创建应该在合理时间内完成', async () => {
    const creator = new DailyReportProjectCreator()
    creator.outputDir = TEST_OUTPUT_DIR

    const startTime = Date.now()
    await creator.createProject('perf-test', { createGitHub: false })
    const endTime = Date.now()

    // 项目创建应该在10秒内完成
    expect(endTime - startTime).toBeLessThan(10000)
  })
})
