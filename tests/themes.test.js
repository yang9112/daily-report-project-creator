/**
 * 主题系��测试
 */

const { ConsoleStyler } = require('../utils/console-styler')
const themeManager = require('../themes')

describe('Theme System', () => {
  describe('Theme Manager', () => {
    test('should have all expected themes', () => {
      const themes = themeManager.getThemeList()
      const themeNames = themes.map(t => t.name)
      
      expect(themeNames).toContain('default')
      expect(themeNames).toContain('minimal')
      expect(themeNames).toContain('vibrant')
      expect(themeNames).toContain('professional')
      expect(themeNames).toContain('dark')
      expect(themeNames).toContain('colorful')
    })

    test('should set theme successfully', () => {
      expect(themeManager.setTheme('professional')).toBe(true)
      expect(themeManager.getCurrentTheme().name).toBe('专业主题')
      
      expect(themeManager.setTheme('dark')).toBe(true)
      expect(themeManager.getCurrentTheme().name).toBe('深色主题')
      
      expect(themeManager.setTheme('colorful')).toBe(true)
      expect(themeManager.getCurrentTheme().name).toBe('彩虹主题')
    })

    test('should handle invalid theme names', () => {
      expect(themeManager.setTheme('nonexistent')).toBe(false)
      // Should stay on previous theme
    })

    test('should format messages correctly', () => {
      themeManager.setTheme('default')
      const message = themeManager.formatMessage('success', '测试消息')
      expect(message).toContain('🟢')
      expect(message).toContain('测试消息')
    })

    test('should apply styles correctly', () => {
      themeManager.setTheme('minimal')
      const title = themeManager.applyStyle('title', '测试标题')
      expect(title).toContain('测试标题')
      expect(title).toContain('=')
    })

    test('should create progress bar', () => {
      themeManager.setTheme('default')
      const progress = themeManager.createProgress(5, 10, '进度')
      expect(progress).toContain('50%')
    })

    test('should create table output', () => {
      themeManager.setTheme('default')
      const headers = ['名称', '状态']
      const rows = [{ 名称: '测试', 状态: '完成' }]
      const table = themeManager.createTable(headers, rows)
      expect(table).toContain('测试')
      expect(table).toContain('完成')
    })
  })

  describe('Console Styler', () => {
    let styler

    beforeEach(() => {
      styler = new ConsoleStyler('default')
    })

    test('should create instance with default theme', () => {
      expect(styler).toBeInstanceOf(ConsoleStyler)
      expect(styler.getTheme().name).toBe('默认主题')
    })

    test('should switch themes', () => {
      expect(styler.setTheme('professional')).toBe(true)
      expect(styler.getTheme().name).toBe('专业主题')
    })

    test('should output without errors', () => {
      const consoleSpy = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      }
      
      // Mock console methods
      const originalConsole = global.console
      global.console = consoleSpy

      styler.success('成功消息', '详细信息')
      styler.error('错误消息', '错误详情')
      styler.warn('警告消息')
      styler.info('信息消息')
      styler.debug('调试消息')
      styler.title('标题')
      styler.section('章节')
      styler.separator()
      styler.bullet('项目')
      styler.number(1, '编号')
      styler.code('代码')
      styler.blockquote('引用')
      styler.bold('粗体')
      styler.italic('斜体')

      expect(consoleSpy.log).toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalled()
      expect(consoleSpy.error).toHaveBeenCalled()
      expect(consoleSpy.info).toHaveBeenCalled()

      // Restore console
      global.console = originalConsole
    })

    test('should handle progress updates', () => {
      const processSpy = {
        stdout: {
          write: jest.fn()
        }
      }
      
      const originalProcess = global.process
      global.process = { ...originalProcess, stdout: processSpy.stdout }

      styler.updateProgress(5, 10, '进度')
      styler.updateProgress(10, 10, '完成')

      expect(processSpy.stdout.write).toHaveBeenCalled()

      // Restore process
      global.process = originalProcess
    })

    test('should create file tree', () => {
      const consoleSpy = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn()
      }
      
      const originalConsole = global.console
      global.console = consoleSpy

      const tree = {
        'folder1': {
          'file1.js': null,
          'file2.css': null
        },
        'folder2': {},
        'file3.md': null
      }

      styler.fileTree(tree)
      expect(consoleSpy.log).toHaveBeenCalled()

      global.console = originalConsole
    })
  })

  describe('Theme Functionality', () => {
    test('should provide unique styling for each theme', () => {
      const themes = ['default', 'minimal', 'vibrant', 'professional', 'dark', 'colorful']
      const titleStyles = []

      themes.forEach(themeName => {
        themeManager.setTheme(themeName)
        const styler = new ConsoleStyler(themeName)
        const title = themeManager.applyStyle('title', '测试标题')
        titleStyles.push(title)
      })

      // Each theme should produce different output
      const uniqueStyles = [...new Set(titleStyles)]
      expect(uniqueStyles.length).toBeGreaterThan(1)
    })

    test('should support all color types', () => {
      const themes = themeManager.getThemeList()
      
      themes.forEach(({ name }) => {
        themeManager.setTheme(name)
        const theme = themeManager.getCurrentTheme()
        
        expect(theme.colors).toHaveProperty('success')
        expect(theme.colors).toHaveProperty('warning')
        expect(theme.colors).toHaveProperty('error')
        expect(theme.colors).toHaveProperty('info')
        expect(theme.colors).toHaveProperty('highlight')
      })
    })

    test('should support all style types', () => {
      const themes = themeManager.getThemeList()
      
      themes.forEach(({ name }) => {
        themeManager.setTheme(name)
        const theme = themeManager.getCurrentTheme()
        
        expect(theme.styles).toHaveProperty('title')
        expect(theme.styles).toHaveProperty('section')
        expect(theme.styles).toHaveProperty('bullet')
        expect(theme.styles).toHaveProperty('number')
        expect(theme.styles).toHaveProperty('bold')
        expect(theme.styles).toHaveProperty('code')
        expect(theme.styles).toHaveProperty('progress')
      })
    })
  })

  describe('Theme Integration', () => {
    test('should work with existing console output methods', () => {
      const styler = new ConsoleStyler('vibrant')
      
      // Mock all console methods
      const originalConsole = global.console
      global.console = {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
      }
      
      expect(() => {
        styler.success('测试')
        styler.error('测试')
        styler.warn('测试')
        styler.info('测试')
      }).not.toThrow()
      
      // Restore console
      global.console = originalConsole
    })

    test('should handle complex formatting', () => {
      themeManager.setTheme('professional')
      
      const headers = ['功能', '状态', '进度']
      const rows = [
        { 功能: '主题系统', 状态: '完成', 进度: '100%' },
        { 功能: '国际化', 状态: '进行中', 进度: '80%' }
      ]
      
      const table = themeManager.createTable(headers, rows)
      expect(table).toContain('主题系统')
      expect(table).toContain('完成')
    })

    test('should create valid progress bars', () => {
      ['minimal', 'professional', 'dark', 'colorful'].forEach(themeName => {
        themeManager.setTheme(themeName)
        
        const progress25 = themeManager.createProgress(2.5, 10)
        const progress50 = themeManager.createProgress(5, 10)
        const progress100 = themeManager.createProgress(10, 10)
        
        expect(progress25).toContain('25')
        expect(progress50).toContain('50')
        expect(progress100).toContain('100')
      })
    })
  })
})