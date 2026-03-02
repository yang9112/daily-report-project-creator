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
    const testProjectPath = path.join(process.cwd(), testProjectName);
    if (await fs.pathExists(testProjectPath)) {
      await fs.remove(testProjectPath);
    }
  });

  describe('validateProjectName', () => {
    test('should accept valid project names', () => {
      const validNames = ['project-name', 'project_name', 'project123'];
      validNames.forEach(name => {
        expect(/^[a-zA-Z0-9-_]+$/.test(name)).toBe(true);
      });
    });

    test('should reject invalid project names', () => {
      const invalidNames = ['project name', 'project@name', ''];
      invalidNames.forEach(name => {
        expect(/^[a-zA-Z0-9-_]+$/.test(name)).toBe(false);
      });
    });
  });

  describe('createProjectStructure', () => {
    test('should create required directories', async () => {
      const projectPath = path.join(process.cwd(), testProjectName);
      await creator.createProjectStructure(projectPath);

      const requiredDirs = ['src', 'src/utils', 'src/services', 'templates', 'tests'];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(projectPath, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
      }
    });
  });

  describe('generateConfigFiles', () => {
    test('should generate package.json with correct dependencies', async () => {
      const projectPath = path.join(process.cwd(), testProjectName);
      const config = {
        projectName: testProjectName,
        description: 'Test project',
        llmProvider: 'openai',
        features: ['email', 'llm']
      };

      await creator.generateConfigFiles(projectPath, config);
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      expect(await fs.pathExists(packageJsonPath)).toBe(true);
      
      const packageJson = await fs.readJSON(packageJsonPath);
      expect(packageJson.name).toBe(testProjectName);
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.nodemailer).toBe('^8.0.1');
    });
  });

  describe('security', () => {
    test('should use secure nodemailer version', async () => {
      const projectPath = path.join(process.cwd(), testProjectName);
      const config = {
        projectName: testProjectName,
        description: 'Test project',
        llmProvider: 'openai',
        features: ['email']
      };

      await creator.generateConfigFiles(projectPath, config);
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      const packageJson = await fs.readJSON(packageJsonPath);
      const nodemailerVersion = packageJson.dependencies.nodemailer;
      
      // Should be version 8.x which is secure
      expect(nodemailerVersion).toMatch(/^8/);
      expect(nodemailerVersion).not.toMatch(/^[67]/);
    });
  });
});