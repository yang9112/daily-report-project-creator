const fs = require('fs')
const path = require('path')
const BatchProjectCreator = require('../scripts/batch-create')

// 测试环境配置
const TEST_OUTPUT_DIR = '/tmp/batch-test'
const TEST_CONFIG_DIR = '/tmp/config-test'

describe('BatchProjectCreator', () => {
  let batchCreator

  beforeEach(() => {
    batchCreator = new BatchProjectCreator();

    // 清理测试目录
    [TEST_OUTPUT_DIR, TEST_CONFIG_DIR].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    })

    // 确保目录存在
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true })
  })

  afterEach(() => {
    // 清理测试目录
    [TEST_OUTPUT_DIR, TEST_CONFIG_DIR].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    })
  })

  describe('generateExampleConfig', () => {
    test('应该生成示例配置文件', () => {
      batchCreator.generateExampleConfig()

      const configPath = path.join(__dirname, '../batch-config.example.json')
      expect(fs.existsSync(configPath)).toBe(true)

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      expect(config).toHaveProperty('projects')
      expect(Array.isArray(config.projects)).toBe(true)
      expect(config.projects.length).toBeGreaterThan(0)
    })

    test('配置文件应该包含正确的结构', () => {
      batchCreator.generateExampleConfig()

      const configPath = path.join(__dirname, '../batch-config.example.json')
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

      // 验证项目结构
      config.projects.forEach(project => {
        expect(project).toHaveProperty('name')
        expect(project).toHaveProperty('description')
        expect(project).toHaveProperty('options')
        expect(project.options).toHaveProperty('llmProvider')
        expect(project.options).toHaveProperty('createGitHub')
      })
    })
  })

  describe('loadConfig', () => {
    test('应该加载有效的配置文件', () => {
      const config = {
        projects: [
          {
            name: 'test-project',
            description: 'Test project',
            options: {
              llmProvider: 'openai',
              createGitHub: false
            }
          }
        ]
      }

      const configPath = path.join(TEST_CONFIG_DIR, 'valid-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      const loadedConfig = batchCreator.loadConfig(configPath)
      expect(loadedConfig).toEqual(config)
    })

    test('应该拒绝不存在的文件', () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'non-existent.json')

      expect(() => batchCreator.loadConfig(configPath)).toThrow('配置文件不存在')
    })

    test('应该拒绝无效的JSON', () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'invalid.json')
      fs.writeFileSync(configPath, '{ invalid json }')

      expect(() => batchCreator.loadConfig(configPath)).toThrow()
    })

    test('应该拒绝缺少projects字段', () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'no-projects.json')
      fs.writeFileSync(configPath, JSON.stringify({}))

      expect(() => batchCreator.loadConfig(configPath)).toThrow('配置文件格式错误')
    })

    test('应该拒绝非数组的projects', () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'wrong-projects.json')
      fs.writeFileSync(configPath, JSON.stringify({ projects: {} }))

      expect(() => batchCreator.loadConfig(configPath)).toThrow('配置文件格式错误')
    })
  })

  describe('batchCreateFromConfig', () => {
    test('应该处理有效的批量配置', async () => {
      const config = {
        projects: [
          {
            name: 'test-project-1',
            description: 'First test project',
            options: { createGitHub: false }
          },
          {
            name: 'test-project-2',
            description: 'Second test project',
            options: { createGitHub: false }
          }
        ]
      }

      const configPath = path.join(TEST_CONFIG_DIR, 'batch-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      // 模拟DailyReportProjectCreator
      const mockCreateProject = jest.fn().mockResolvedValue('/mock/path')
      batchCreator.creator = { createProject: mockCreateProject }

      await batchCreator.batchCreateFromConfig(configPath)

      expect(mockCreateProject).toHaveBeenCalledTimes(2)
      expect(mockCreateProject).toHaveBeenCalledWith('test-project-1', config.projects[0].options)
      expect(mockCreateProject).toHaveBeenCalledWith('test-project-2', config.projects[1].options)
    })

    test('应该处理单个项目失败的情况', async () => {
      const config = {
        projects: [
          {
            name: 'valid-project',
            description: 'Valid project',
            options: { createGitHub: false }
          },
          {
            name: 'invalid-project',
            description: 'Invalid project',
            options: { createGitHub: false }
          }
        ]
      }

      const configPath = path.join(TEST_CONFIG_DIR, 'mixed-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      const mockCreateProject = jest.fn()
        .mockResolvedValueOnce('/valid/path')
        .mockRejectedValueOnce(new Error('Creation failed'))

      batchCreator.creator = { createProject: mockCreateProject }

      // 应该不会抛出错误，即使部分项目创建失败
      await expect(batchCreator.batchCreateFromConfig(configPath)).resolves.not.toThrow()
    })

    test('应该处理空项目列表', async () => {
      const config = { projects: [] }

      const configPath = path.join(TEST_CONFIG_DIR, 'empty-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      const mockCreateProject = jest.fn()
      batchCreator.creator = { createProject: mockCreateProject }

      await batchCreator.batchCreateFromConfig(configPath)

      expect(mockCreateProject).not.toHaveBeenCalled()
    })
  })

  describe('集成测试', () => {
    test('完整的批量创建流程', async () => {
      // 1. 生成示例配置
      batchCreator.generateExampleConfig()
      const exampleConfigPath = path.join(__dirname, '../batch-config.example.json')

      // 2. 加载配置
      const config = batchCreator.loadConfig(exampleConfigPath)
      expect(config.projects.length).toBeGreaterThan(0)

      // 3. 模拟创建（不实际创建GitHub仓库）
      const mockCreateProject = jest.fn().mockImplementation((name, options) => {
        return Promise.resolve(`/tmp/daily-report-${name}`)
      })

      batchCreator.creator = { createProject: mockCreateProject }

      // 4. 执行批量创建
      await batchCreator.batchCreateFromConfig(exampleConfigPath)

      // 5. 验证结果
      expect(mockCreateProject).toHaveBeenCalledTimes(config.projects.length)
    })
  })

  describe('错误处���和边界情况', () => {
    test('应该处理项目名称重复', async () => {
      const config = {
        projects: [
          {
            name: 'duplicate-name',
            description: 'First project',
            options: { createGitHub: false }
          },
          {
            name: 'duplicate-name',
            description: 'Second project',
            options: { createGitHub: false }
          }
        ]
      }

      const configPath = path.join(TEST_CONFIG_DIR, 'duplicate-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      const mockCreateProject = jest.fn().mockResolvedValue('/mock/path')
      batchCreator.creator = { createProject: mockCreateProject }

      // 应该处理重复名称的情况
      await expect(batchCreator.batchCreateFromConfig(configPath)).resolves.not.toThrow()
      expect(mockCreateProject).toHaveBeenCalledTimes(2)
    })

    test('应该处理大量项目', async () => {
      // 创建包含100个项目的配置
      const projects = Array.from({ length: 100 }, (_, i) => ({
        name: `project-${i}`,
        description: `Project ${i}`,
        options: { createGitHub: false }
      }))

      const config = { projects }
      const configPath = path.join(TEST_CONFIG_DIR, 'large-config.json')
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

      const mockCreateProject = jest.fn().mockResolvedValue('/mock/path')
      batchCreator.creator = { createProject: mockCreateProject }

      const startTime = Date.now()
      await batchCreator.batchCreateFromConfig(configPath)
      const endTime = Date.now()

      // 验证所有项目都被处理
      expect(mockCreateProject).toHaveBeenCalledTimes(100)

      // 性能检查：100个项目应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(30000)
    })
  })
})

// 内存和资源测试
describe('Resource Management Tests', () => {
  beforeEach(() => {
    // 确保测试目录存在
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true })
  })

  test('应该正确处理内存使用', async () => {
    const batchCreator = new BatchProjectCreator()

    // 创建大型配置文件
    const largeConfig = {
      projects: Array.from({ length: 50 }, (_, i) => ({
        name: `memory-test-${i}`,
        description: `Memory test project ${i} with a longer description to test memory usage`,
        options: {
          llmProvider: 'openai',
          model: 'gpt-3.5-turbo',
          limitArticles: 20,
          createGitHub: false,
          additionalConfig: {
            largeData: 'x'.repeat(1000) // 增加内存使用
          }
        }
      }))
    }

    const configPath = path.join(TEST_CONFIG_DIR, 'memory-config.json')
    fs.writeFileSync(configPath, JSON.stringify(largeConfig, null, 2))

    const mockCreateProject = jest.fn().mockResolvedValue('/mock/path')
    batchCreator.creator = { createProject: mockCreateProject }

    // 测试内存不会异常增长
    const initialMemory = process.memoryUsage().heapUsed
    await batchCreator.batchCreateFromConfig(configPath)
    const finalMemory = process.memoryUsage().heapUsed

    // 内存增长应该在合理范围内（不超过100MB）
    expect(finalMemory - initialMemory).toBeLessThan(100 * 1024 * 1024)
  })
})
