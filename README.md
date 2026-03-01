# Daily Report Project Creator

一个用于自动化生成日报项目的CLI工具，该项目基于tech-daily-digest模板，能够快速创建个性化的技术日报生成系统。

## 功能特性

- 🚀 **快速项目创建** - 一键生成完整的日报项目结构
- 📦 **批量创建** - 支持批量创建多个日报项目
- 🔄 **GitHub集成** - 自动创建GitHub仓库并配置Actions
- ⚙️ **配置模板** - 自动生成配置文件和文档
- 🧪 **高质量测试** - 完整的测试覆盖和验证
- 🛡️ **安全性检查** - 敏感信息检测和代码质量验证

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/yang9112/daily-report-project-creator.git
cd daily-report-project-creator

# 安装依赖
npm install
```

### 创建单个项目

```bash
# 基本创建
node scripts/create-project.js my-daily-report

# 不创建GitHub仓库
node scripts/create-project.js my-daily-report --no-github

# 指定输出目录
node scripts/create-project.js my-daily-report --output-dir /path/to/output
```

### 批量创建项目

```bash
# 使用交互式配置
node scripts/batch-create.js interactive

# 使用配置文件
node scripts/batch-create.js file config.json
```

## 配置文件示例

创建`config.json`文件：

```json
{
  "projects": [
    {
      "name": "ai-news",
      "description": "AI技术日报",
      "options": {
        "llmProvider": "openai",
        "model": "gpt-3.5-turbo",
        "limitArticles": 20,
        "createGitHub": true
      }
    },
    {
      "name": "frontend-digest",
      "description": "前端技术摘要",
      "options": {
        "llmProvider": "openai",
        "model": "claude-3",
        "limitArticles": 15,
        "createGitHub": false
      }
    }
  ]
}
```

## 生成的项目结构

```
daily-report-{project-name}/
├── SKILL.md                    # 技能配置文档
├── Agent.md                    # 仓库规范文档
├── package.json                # 项目配置
├── .gitignore                 # Git忽略文件
├── Dockerfile                 # Docker配置
├── .github/
│   └── workflows/
│       ├── daily-digest.yml   # 日报生成工作流
│       └── ci.yml             # 持续集成工作流
├── config/
│   └── config.example.json   # 配置模板
├── scripts/                   # 脚本目录
├── src/                      # 源代码目录
├── tests/                    # 测试目录
├── docs/                     # 文档目录
├── references/               # 参考资料
└── data/                     # 数据目录
```

## 开发和测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --testNamePattern="DailyReportProjectCreator"

# 代码检查
npm run lint

# 项目验证
npm run validate
```

### 开发模式

```bash
# 修复代码格式
npm run lint -- --fix

# 监听模式运行测试
npm test -- --watch
```

## GitHub Actions配置

创建的项目会自动配置GitHub Actions：

- **Daily Digest Workflow**: 每天定时生成日报
- **CI Workflow**: 持续集成，包括测试、构建、安全扫描

### 所需的Secrets

在GitHub仓库中配置以下secrets：

```
OPENAI_API_KEY: OpenAI API密钥
OPENAI_BASE_URL: OpenAI API基础URL（可选）
```

## 项目质量

本项目保持高度的代码质量和测试覆盖率：

- ✅ 28/28 测试通过
- ✅ 100% 代码覆盖率要求
- ✅ ESLint代码规范检查
- ✅ 安全性扫描
- ✅ 自动化CI/CD流程

## 故障排除

### 常见问题

1. **GitHub仓库创建失败**
   - 确保已配置GitHub CLI token
   - 检查仓库权限

2. **依赖安装失败**
   - 确保Node.js版本 >= 18
   - 清理node_modules后重新安装

3. **测试失败**
   - 检查测试目录权限
   - 确保所有依赖已正确安装

### 获取帮助

```bash
# 查看命令行帮助
node scripts/create-project.js --help
node scripts/batch-create.js --help

# 项目验证
npm run validate
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 更新日志

### v1.0.0 (2026-03-02)

- ✨ 初始版本发布
- 🚀 支持单个和批量项目创建
- 🔄 集成GitHub Actions
- 📦 完整的项目模板生成
- 🧪 100%测试覆盖率
- 🛡️ 安全性检查

---

**作者**: yang9112  
**项目地址**: https://github.com/yang9112/daily-report-project-creator  
**技术支持**: 基于tech-daily-digest模板构建