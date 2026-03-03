const fs = require('fs-extra')
const path = require('path')

// Setup test environment
const testTempDir = path.join(__dirname, '../temp')

beforeAll(async () => {
  // Create temporary directory for tests
  await fs.ensureDir(testTempDir)
})

afterAll(async () => {
  // Clean up temporary directory
  await fs.remove(testTempDir)
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}
