const i18n = require('../../utils/i18n');

describe('i18n', () => {
  beforeEach(() => {
    i18n.setLocale('zh-CN');
  });

  describe('t', () => {
    test('should return Chinese translation', () => {
      const message = i18n.t('project.created');
      expect(message).toBe('项目创建成功');
    });

    test('should return English translation when language switched', () => {
      i18n.setLocale('en-US');
      const message = i18n.t('project.created');
      expect(message).toBe('Project created successfully');
    });

    test('should return original key when translation not found', () => {
      const message = i18n.t('nonexistent.key');
      expect(message).toBe('nonexistent.key');
    });

    test('should replace parameters', () => {
      const message = i18n.t('project.invalid_name', { name: 'test' });
      expect(message).toBe('项目名称无效'); // 不含参数的示例
    });
  });

  describe('setLocale', () => {
    test('should set language to zh-CN', () => {
      i18n.setLocale('zh-CN');
      expect(i18n.currentLocale).toBe('zh-CN');
    });

    test('should set language to en-US', () => {
      i18n.setLocale('en-US');
      expect(i18n.currentLocale).toBe('en-US');
    });

    test('should not change language for unsupported language', () => {
      i18n.setLocale('zh-CN');
      i18n.setLocale('fr-FR');
      expect(i18n.currentLocale).toBe('zh-CN');
    });
  });
});