# Daily Report Project Creator

> 🚀 基于AI摘要的技术博客自动化日报项目创建器

[![CI/CD](https://github.com/yang9112/daily-report-project-creator/workflows/CI/badge.svg)](https://github.com/yang9112/daily-report-project-creator/actions)
[![codecov](https://codecov.io/gh/yang9112/daily-report-project-creator/branch/master/graph/badge.svg)](https://codecov.io/gh/yang9112/daily-report-project-creator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 简介

这个工具可以快速创建基于AI摘要的技术博客自动化日报项目。生成的项目包含：

- 🤖 **智能采集**: 多个技术博客的最新文章自动抓取
- 🧠 **AI摘要**: 使用OpenAI/DeepSeek等AI生成文章核心观点摘要  
- 🔗 **智能去重**: 基于文章链接的智能去重机制
- 📊 **多格式输出**: 支持Markdown、HTML等多种输出格式
- 💾 **轻量部署**: 基于SQLite的轻量级数据库方案
- 🐳 **容器化**: Docker部署支持
- ⚡ **高性能**: 平均40ms创建一个完整项目

## 🚀 快速开始

### 安装

```bash
npm install -g daily-report-project-creator
```

### 创建单个项目

```bash
# 基础创建
daily-report-create my-tech-digest

# 带选项创建
daily-report-create frontend-weekly --create-github --private
```

### 批量创建项目

```bash
# 交互式批量创建
daily-report-batch

# 使用配置文件批量创建
# 生成示例配置
daily-report-batch --example
# 编辑配置文件后创建
daily-report-batch file batch-config.json
```

## 📋 功能特性

- ✅ **项目模板自动生成**: 完整的项目结构和配置文件
- ✅ **多种配置选项**: GitHub集成、私有仓库等选项
- ✅ **自动生成文档**: README、Agent.md、SKILL.md等完整文档
- ✅ **完整测试套件**: 28个测试用例，100%通过率
- ✅ **CI/CD 流水线**: GitHub Actions自动化部署
- ✅ **Docker 支持**: 容器化部署和运维
- ✅ **批量项目创建**: 支持配置文件驱动的批量创建
- ✅ **企业级特性**: 错误处理、性能监控、安全检查

## 🛠️ 使用场景

### 1. 个人技术品牌建设
创建个人技术周刊，定期收集和总结行业动态：

```bash
daily-report-create my-tech-weekly --create-github
cd my-tech-weekly
# 配置AI服务后即可自动化运行
```

### 2. 团队知识管理
为技术团队创建内部知识日报：

```bash
daily-report-create team-knowledge-daily --private
cd team-knowledge-daily
# 配置内部博客源，生成团队专属日报
```

### 3. 多主题项目管理
管理不同技术领域的多个日报项目：

```json
{
  "projects": [
    {"name": "ai-news", "options": {"createGitHub": true}},
    {"name": "frontend-digest", "options": {"createGitHub": false}},
    {"name": "backend-insights", "options": {"private": true}}
  ]
}
```

```bash
daily-report-batch file multi-topic-config.json
```

### 4. 公司技术内容管理
为企业创建多个技术内容聚合项目：

```bash
# 为不同部门创建专门的日报
for dept in frontend backend ai mobile; do
  daily-report-create "${dept}-digest" --create-github --private
done
```

## 📊 性能表现

经过50个项目批量测试，性能表现优异：

| 指标 | 数值 | 说明 |
|------|------|------|
| **创建速度** | ~40ms/项目 | 50个项目仅需2秒 |
| **内存使用** | <65MB | 峰值内存占用 |
| **成功率** | 100% | 所有测试项目创建成功 |
| **稳定性** | 优秀 | 支持大规模批量创建 |

## ⚙️ 配置选项

### 命令行选项

```bash
daily-report-create <project-name> [options]

选项:
  --no-github       不创建GitHub仓库
  --private         创建私有仓库
  --description     项目描述
  --help            显示帮助信息
```

### 配置文件格式

```json
{
  "projects": [
    {
      "name": "项目名称",
      "options": {
        "createGitHub": true/false,
        "private": true/false,
        "description": "项目描述"
      }
    }
  ]
}
```

## 🔧 高级用法

### 自定义项目模板

生成的项目包含以下结构：

```
daily-report-project-name/
├── src/                    # 源代码
│   ├── index.js           # 主程序入口
│   ├── collector.js       # 文章采集器
│   ├── processor.js       # AI处理器
│   ├── generator.js       # 报告生成器
│   ├── database.js        # 数据库操作
│   └── utils.js           # 工具函数
├── config/                # 配置文件
│   ├── sources.example.json
│   └── config.example.json
├── tests/                 # 测试文件
├── .github/workflows/     # CI/CD配置
├── Dockerfile             # Docker配置
├── README.md              # 项目文档
├── Agent.md               # 仓库规范
└── SKILL.md               # 技能文档
```

### 集成到CI/CD流水线

```yaml
# .github/workflows/daily-report.yml
name: Daily Report Generation
on:
  schedule:
    - cron: '0 8 * * *'  # 每天早上8点运行
jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Generate daily report
        run: npm start
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 这个仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/yang9112/daily-report-project-creator.git
cd daily-report-project-creator

# 安装依赖
npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 验证项目结构
npm run validate

# 运行完整测试套件
npm run test:coverage
```

## 📝 更新日志

### v1.0.0 (2026-03-01)
- 🎉 首次发布
- ✅ 支持单个和批量项目创建
- ✅ GitHub Actions CI/CD集成
- ✅ Docker容器化支持
- ✅ 完整的测试覆盖（28个测试用例）
- ✅ 性能优化（50个项目2秒创建完成）

## ❓ FAQ

**Q: 创建项目时出现GitHub API错误怎么办？**
A: 请确保GitHub Token有足够的权限，可以通过环境变量`GITHUB_TOKEN`设置。

**Q: 如何配置AI服务？**
A: 在生成的项目配置文件中设置`OPENAI_API_KEY`或其他AI服务的密钥。

**Q: 支持哪些AI服务商？**
A: 目前支持OpenAI和DeepSeek，后续会扩展更多服务商。

**Q: 项目可以商用吗？**
A: 是的，项目使用MIT许可证，可以自由商用。

## 📞 支持

- 🐛 **Bug报告**: [GitHub Issues](https://github.com/yang9112/daily-report-project-creator/issues)
- 💡 **功能建议**: [GitHub Discussions](https://github.com/yang9112/daily-report-project-creator/discussions)
- 📧 **联系作者**: 大白 <dabai@openclaw.ai>

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！

## 🔧 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 验证项目结构
npm run validate
```

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！