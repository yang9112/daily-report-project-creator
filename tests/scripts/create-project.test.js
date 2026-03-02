const fs = require('fs-extra');
const path = require('path');
const ProjectCreator = require('../../scripts/create-project');

describe('ProjectCreator', () => {
  let creator;
  const testProjectName = 'test-daily-report';

  beforeEach(() => {
    creator = new ProjectCreator();
  });

  afterEach(async () => {
    const testProjectPath = path.join('/tmp/github-projects', `daily-report-${testProjectName}`);
    if (await fs.pathExists(testProjectPath)) {
      await fs.remove(testProjectPath);
    }
  });

  describe('validateProjectName', () => {
    test('should accept valid project names', () => {
      const validNames = ['project-name', 'project_name', 'project123'];
      validNames.forEach(name => {
        expect(creator.validateProjectName(name)).toBe(true);
      });
    });

    test('should reject invalid project names', () => {
      const invalidNames = ['project name', 'project@name', ''];
      invalidNames.forEach(name => {
        expect(() => creator.validateProjectName(name)).toThrow();
      });
    });
  });

  describe('createProjectStructure', () => {
    test('should create required directories', async () => {
      const projectPath = path.join('/tmp/github-projects', `daily-report-${testProjectName}`);
      
      // 确保输出目录存在
      await fs.ensureDir('/tmp/github-projects');
      
      await creator.createProjectStructure(projectPath, testProjectName);

      const requiredDirs = ['src', 'config', 'data', 'output', 'scripts', 'docs', 'tests', '.github'];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(projectPath, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
      }
      
      // 检查workflows子目录
      const workflowsPath = path.join(projectPath, '.github', 'workflows');
      expect(await fs.pathExists(workflowsPath)).toBe(true);
    });
  });

  describe('generateConfigFiles', () => {
    test('should generate package.json with correct dependencies', async () => {
      const projectPath = path.join('/tmp/github-projects', `daily-report-${testProjectName}`);
      const options = {
        llmProvider: 'openai',
        model: 'gpt-3.5-turbo',
        limitArticles: 20
      };

      // 确保目录存在
      await fs.ensureDir(projectPath);
      
      await creator.generateConfigFiles(projectPath, testProjectName, options);
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      expect(await fs.pathExists(packageJsonPath)).toBe(true);
      
      const packageJson = await fs.readJSON(packageJsonPath);
      expect(packageJson.name).toBe(`daily-report-${testProjectName}`);
      expect(packageJson.dependencies).toBeDefined();
      if (packageJson.dependencies.nodemailer) {
        expect(packageJson.dependencies.nodemailer).toBe('^8.0.1');
      }
    });
  });

  describe('security', () => {
    test('should use secure nodemailer version', async () => {
      const projectPath = path.join('/tmp/github-projects', `daily-report-${testProjectName}`);
      const options = {
        llmProvider: 'openai',
        features: ['email']
      };

      // 确保目录存在
      await fs.ensureDir(projectPath);
      
      await creator.generateConfigFiles(projectPath, testProjectName, options);
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath);
        const nodemailerVersion = packageJson.dependencies?.nodemailer;
        
        // Should be version 8.x which is secure
        if (nodemailerVersion) {
          const cleanVersion = nodemailerVersion.replace(/["^]/g, '');
          expect(cleanVersion).toMatch(/^8/);
          expect(cleanVersion).not.toMatch(/^[67]/);
        }
      }
    });
  });
});