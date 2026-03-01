// Jest测试环境设置

/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
/* eslint-enable no-console */

// 全局测试配置
global.TEST_CONFIG = {
  timeout: 30000, // 30秒超时
  tempDirs: []
}

// 测试环境设置
beforeAll(() => {
  // 设置环境变量
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-api-key'

  // 确保测试时不会创建真实的GitHub仓库
  process.env.TEST_MODE = 'true'
})

// 每个测试前的清理
beforeEach(() => {
  // 记录当前内存使用
  global.TEST_CONFIG.initialMemory = process.memoryUsage().heapUsed
})

// 每个测试后的清理
afterEach(() => {
  // 检查内存泄漏
  const finalMemory = process.memoryUsage().heapUsed
  const initialMemory = global.TEST_CONFIG.initialMemory

  if (finalMemory - initialMemory > 50 * 1024 * 1024) { // 50MB
    console.warn(`⚠️  Memory leak detected: ${Math.round((finalMemory - initialMemory) / 1024 / 1024)}MB`)
  }
})

// 全局清理
afterAll(() => {
  // 清理临时目录
  global.TEST_CONFIG.tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

// 辅助函数：创建临��目录
global.createTempDir = function (name) {
  const tempDir = path.join('/tmp', `test-${name}-${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })
  global.TEST_CONFIG.tempDirs.push(tempDir)
  return tempDir
}

// 辅助函数：创建项目测试目录结构
global.createProjectTestDir = function (projectPath) {
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

  return projectPath
}

// 辅助函数：模拟文件系统操作
global.mockFileSystem = function () {
  // 这里可以添加文件系统模拟逻辑
  return {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    rmSync: jest.fn()
  }
}

// 测试用的项目模板
global.TEST_PROJECT_TEMPLATE = {
  name: 'test-project',
  description: 'Test project for unit testing',
  options: {
    llmProvider: 'openai',
    model: 'gpt-3.5-turbo',
    limitArticles: 10,
    createGitHub: false
  }
}

// 控制台输出过滤
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

console.warn = (...args) => {
  // 过滤掉已知的警告信息
  const message = args.join(' ')
  if (!message.includes('deprecated') && !message.includes('experimental')) {
    originalConsoleWarn(...args)
  }
}

console.error = (...args) => {
  // 在测试环境下，某些错误是预期的
  const message = args.join(' ')
  if (process.env.SHOW_TEST_ERRORS !== 'true') {
    if (message.includes('Permission denied') || message.includes('File exists')) {
      return
    }
  }
  originalConsoleError(...args)
}
