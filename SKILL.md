---
name: daily-report-skill-creator
description: 将现有的技术博客日报技能打包成开源项目的完整工具。支持复制tech-daily-digest技能、生成独立项目结构、配置GitHub仓库，并按照Agent.md规范发布到GitHub。
---

# 日报技能开源项目创建器 (Daily Report Skill Creator)

## 🎯 核心价值
将现有的技术博客日报技能（tech-daily-digest）打包成可独立运行的开源项目。

## 🚀 核心特性
- **项目初始化**: 基于现有tech-daily-digest创建新项目结构
- **GitHub仓库管理**: 自动创建和配置GitHub仓库
- **规范文档生成**: 复制并适配Agent.md规范
- **依赖管理**: 自动生成package.json和依赖配置
- **README生成**: 智能创建项目说明文档
- **配置模板**: 提供可配置的系统模板

## 🏗️ 工作流程决策树

### 场景1: 创建全新的日报项目
```
分析需求 → 复制核心代码 → 初始化项目结构 → 生成配置文件 → 创建GitHub仓库 → 提交代码
```

### 场景2: 基于现有项目定制
```
分析现有项目 → 提取可复用组件 → 适配配置 → 创建新仓库 → 部署测试
```

### 场景3: 批量创建多个变体项目
```
定义项目模板 → 批量生成配置 → 批量创建仓库 → 统一管理
```

## 📋 项目创建步骤

### 1. 项目需求分析
- 确定项目名称和描述
- 分析目标用户群体
- 定义功能范围和特色
- 规划部署方式

### 2. 核心代码复制
```javascript
// scripts/copy_core.js - 复制核心功能模块
const coreModules = [
  'collector.js',      // RSS采集器
  'processor.js',      // 文章处理器
  'generator.js',      // 日报生成器
  'database.js',       // 数据库操作
  'config.js'          // 配置管理
];
```

### 3. 项目结构初始化
```
daily-report-{project-name}/
├── src/                    # 源代码
├── config/                 # 配置文件
├── data/                   # 数据目录
├── output/                 # 输出目录
├── scripts/                # 工具脚本
├── docs/                   # 文档
├── Agent.md               # 仓库规范
├── README.md              # 项目说明
├── package.json           # 依赖配置
├── .gitignore            # Git忽略配置
└── LICENSE               # 开源协议
```

### 4. GitHub仓库创建
```bash
# scripts/create_repo.js - GitHub API创建仓库
gh repo create {project-name} --public --description="{description}"
--clone=false
```

### 5. 规范文档配置
参考`/root/workspace-dev/yang9112.github.io/Agent.md`规范：
- 复制Agent.md模板
- 根据项目特性调整规范
- 配置.gitignore文件
- 设置敏感信息保护

## 🛠️ 使用方法

### 快速创建项目
```bash
cd /root/workspace/github-project-creator
node scripts/create-project.js --name "my-daily-report" --desc "我的技术日报项目"
```

### 交互式创建
```bash
node scripts/create-project.js --interactive
```

### 批量创建
```bash
node scripts/batch-create.js --config batch-config.json
```

## 📊 配置文件模板

### package.json模板
```json
{
  "name": "daily-report-{project-name}",
  "version": "1.0.0",
  "description": "{项目描述}",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "collect": "node src/collector.js",
    "process": "node src/processor.js",
    "digest": "node src/generator.js"
  },
  "dependencies": {
    "sqlite3": "^5.1.6",
    "feedparser": "^2.2.10",
    "axios": "^1.6.0",
    "openai": "^4.20.0"
  }
}
```

### Agent.md规范模板
```markdown
# Agent.md — 仓库文档与数据上传规范

## 项目特定规范
- 仅上传源代码和配置文件
- 禁止上传数据库文件和缓存
- 配置文件使用模板形式
- API密钥使用环境变量
```

## 🎯 高级功能

### 自定义模板系统
```javascript
// scripts/template_generator.js - 生成项目模板
const templates = {
  basic: '基础版日报系统',
  advanced: '高级版（含多源支持）',
  enterprise: '企业版（含权限管理）'
};
```

### CI/CD集成
```yaml
# .github/workflows/daily-digest.yml
name: Daily Digest
on:
  schedule:
    - cron: '0 9 * * *'
jobs:
  generate-digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Generate daily digest
        run: npm run digest
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## 📈 质量保证

### 代码验证
```javascript
// scripts/validate.js - 项目验证
function validateProject(projectPath) {
  // 检查必需文件
  // 验证配置文件格式
  // 检查依赖完整性
  // 确认GitHub仓库连接
}
```

### 测试覆盖
```javascript
// tests/ 项目测试
describe('Daily Report Skill', () => {
  test('should collect articles correctly');
  test('should generate digest properly');
  test('should handle errors gracefully');
});
```

## 🚀 部署指南

### 本地开发
1. 运行项目创建脚本
2. 安装依赖：`npm install`
3. 配置环境变量
4. 运行：`npm start`

### 云端部署
1. 创建GitHub仓库
2. 配置GitHub Actions
3. 设置环境变量密钥
4. 测试自动化流程

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

## 📝 最佳实践

### 项目命名规范
- 使用kebab-case：`daily-report-ai-summary`
- 包含功能关键词
- 避免过于通用的名称

### 仓库管理
- 设置明确的项目描述
- 配置合适的标签和分类
- 启用Issues和PR功能
- 配置保护分支规则

### 文档维护
- 保持README.md的时效性
- 定期更新CHANGELOG.md
- 提供详细的安装和使用指南
- 添加常见问题解答

---

## Resources (optional)

### scripts/
- **create-project.js**: 主要的项目创建脚本
- **copy_core.js**: 复制核心功能模块
- **init_repo.js**: GitHub仓库初始化
- **template_generator.js**: 生成项目模板
- **validate.js**: 项目验证和质量检查

### references/
- **project-structures.md**: 不同类型项目的结构参考
- **config-templates.md**: 配置文件模板集合
- **deployment-guides.md**: 各种部署方式指南
- **best-practices.md**: 项目最佳实践

### assets/
- **logo.svg**: 项目Logo模板
- **license-templates/**: 各种开源协议模板
- **ci-templates/**: CI/CD配置模板
- **doc-templates/**: 文档模板

---

**🚀 让优秀的日报技能成为开源项目，让更多人受益！**