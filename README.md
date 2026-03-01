# Daily Report Project Creator 📰

> 基于技术��客日报技能的开源项目一键生成工具

## 🎯 项目简介

日常记录项目创建器（Daily Report Project Creator）是一个自动化工具，能够将技术博客日报技能打包成独立的开源项目。通过简单的命令行交互，您可以快速创建包含完整项目结构、配置文件、CI/CD流程的技术博客日报项目。

## 🚀 核心功能

- **一键生成**: 基于配置模板快速生成完整的���目结构
- **批量创建**: 支持通过配置文件批量创建多个项目
- **智能配置**: 自动生成配置文件模板和示例
- **完整工具链**: 包含Docker、GitHub Actions、测试框架等
- **标准化输出**: 生成符合开源项目规范的代码结构

## 📦 安装和使用

### 安装依赖

```bash
npm install
```

### 创建单个项目

```bash
npm run create my-tech-daily
```

### 批量创建项目

1. 创建配置文件 `batch-config.json`:

```json
{
  "projects": [
    {
      "name": "ai-news-daily",
      "description": "AI技术新闻日报",
      "options": {
        "llmProvider": "openai",
        "model": "gpt-3.5-turbo"
      }
    },
    {
      "name": "frontend-digest", 
      "description": "前端技术周刊",
      "options": {
        "llmProvider": "openai",
        "model": "gpt-4"
      }
    }
  ]
}
```

2. 执行批量创建:

```bash
npm run batch
```

### 全局安装使用

```bash
npm install -g .
daily-report-create my-project
daily-report-batch batch-config.json
```

## 🏗️ 项目结构

生成的项目包含以下结构：

```
daily-report-{project-name}/
├── src/                    # 核心源代码
├── config/                 # 配置文件
├── scripts/               # 工具脚本
├── tests/                 # 测试文件
├── .github/workflows/     # CI/CD配置
├── docs/                  # 文档
├── SKILL.md               # 技能说明
├── Agent.md               # 仓库规范
├── Dockerfile            # Docker配置
├── package.json          # 项目配置
└── README.md             # 项目说明
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 代码质量检查
npm run lint
```

## 📝 开发指南

### 修改项目模板

项目模板位于 `scripts/` 目录下：
- `create-project.js` - 主创建逻辑
- `batch-create.js` - 批量创建逻辑

### 自定义配置

可以通过修改 `createProject` 方法的参数来定制生成的项目：

```javascript
await creator.createProject('my-project', {
  llmProvider: 'openai',
  model: 'gpt-4',
  createGitHub: true,
  customConfig: { /* 自定义配置 */ }
});
```

## 🔧 配置选项

创建项目时支持以下选项：

- `llmProvider`: LLM提供商 (openai/claude等)
- `model`: 使用的模型名称
- `createGitHub`: 是否创建GitHub仓库
- `customSources`: 自定义RSS源列表
- `templateDir`: 自定义模板目录

## 🎨 特性亮点

- **开箱即用**: 生成的项目包含完整的功能代码
- **最佳实践**: 遵循Node.js项目最佳实践
- **安全优先**: 包含安全检查和依赖审查
- **可扩展性**: 支持自定义模板和配置
- **持续集成**: 预配置GitHub Actions工作流

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个工具！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/yang9112/daily-report-project-creator/issues)
- 作者: [yang9112](https://github.com/yang9112)

---

让技术博客日报项目的创建变得简单高效！🚀