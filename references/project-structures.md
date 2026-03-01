# 项目结构参考

## 基础版 daily-report-basic

适用于个人或小团队的轻量级日报系统。

```
daily-report-basic/
├── package.json           # 项目配置和依赖
├── README.md              # 项目说明
├── Agent.md               # 仓库规范
├── .gitignore            # Git忽略配置
├── .env.example          # 环境变量模板
├── Dockerfile            # Docker配置
├── src/
│   ├── index.js          # 主入口
│   ├── collector.js      # RSS采集器
│   ├── processor.js      # 文章处理器
│   ├── generator.js      # 日报生成器
│   └── database.js       # 数据库操作
├── config/
│   ├── config.example.json  # 系统配置模板
│   └── sources.example.json # 数据源模板
├── data/                 # SQLite数据库（本地运行）
├── output/               # 生成的日报文件
└── .github/workflows/
    └── daily-digest.yml  # GitHub Actions自动运行
```

**特点:**
- 单一数据库，简单易用
- 支持基础的RSS采集和AI摘要
- 自动化部署到GitHub Pages
- 适合个人技术博客聚合

---

## 高级版 daily-report-advanced

适用于中型团队的多源、多格式日报系统。

```
daily-report-advanced/
├── package.json
├── README.md
├── Agent.md
├── .gitignore
├── docker-compose.yml    # 多服务编排
├── src/
│   ├── index.js
│   ├── collectors/        # 多种采集器
│   │   ├── rss.js        # RSS采集器
│   │   ├── api.js        # API采集器
│   │   └── webcraper.js  # 网页采集器
│   ├── processors/        # 多种处理器
│   │   ├── ai.js         # AI处理器
│   │   ├── keyword.js    # 关键词提取器
│   │   └── category.js   # 分类处理器
│   ├── generators/        # 多种生成器
│   │   ├── markdown.js   # Markdown生成器
│   │   ├── html.js       # HTML生成器
│   │   ├── pdf.js        # PDF生成器
│   │   └── email.js      # 邮件发送器
│   ├── database/
│   │   ├── sqlite.js     # SQLite适配器
│   │   ├── mysql.js      # MySQL适配器
│   │   └── mongodb.js    # MongoDB适配器
│   └── utils/
│       ├── scheduler.js  # 调度器
│       ├── cache.js      # 缓存管理
│       └── logger.js     # 日志系统
├── config/
│   ├── database.json     # 数据库配置
│   ├── llm.json          # LLM配置
│   ├── output.json       # 输出配置
│   └── sources/
│       ├── tech.json     # 技术类源
│       ├── news.json     # 新闻类源
│       └── company.json  # 公司内部源
├── data/                 # 数据目录
├── output/               # 输出目录
├── logs/                 # 日志目录
├── tests/                # 测试文件
├── docs/                 # 详细文档
├── scripts/              # 维护脚本
└── .github/workflows/
    ├── daily.yml         # 日报生成
    ├── deploy.yml        # 部署流程
    └── test.yml          # 测试流程
```

**特点:**
- 支持多种数据库（SQLite, MySQL, MongoDB）
- 采集器插件化，支持RSS、API、网页抓取
- 多格式输出（Markdown, HTML, PDF, Email）
- 完整的日志系统和缓存机制
- 支持分类管理和权限控制

---

## 企业版 daily-report-enterprise

适用于大型企业的完整信息聚合和分发平台。

```
daily-report-enterprise/
├── package.json
├── README.md
├── Agent.md
├── docker-compose.yml
├── kubernetes/           # K8s部署配置
├── helm/                 # Helm Charts
├── src/
│   ├── api/              # REST API服务
│   ├── web/              # Web管理界面
│   ├── workers/          # 后台工作器
│   ├── services/         # 微服务
│   │   ├── auth/         # 认证服务
│   │   ├── notification/ # 通知服务
│   │   ├── analytics/    # 统计分析
│   │   └── integration/  # 第三方集成
│   └── shared/           # 共享模块
├── frontend/             # React前端应用
├── mobile/               # 移动端应用
├── config/
│   ├── environments/     # 环境配置
│   ├── services/         # 服务配置
│   └── policies/         # 策略配置
├── data/                 # 数据目录
├── metrics/              # 监控指标
├── backups/              # 备份目录
├── tests/                # 测试套件
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── e2e/              # 端到端测试
├── docs/                 # 完整文档
├── scripts/              # 运维脚本
└── .github/
    ├── workflows/        # CI/CD流程
    ├── policies/         # GitHub策略
    └── security/         # 安全配置
```

**特点:**
- 微服务架构，支持水平扩展
- 完整的用户管理和权限系统
- Web管理界面和移动端支持
- 企业级安全和合规性
- 完整的监控、日志、告警体系
- 支持多租户和多语言

---

## 专用版示例

### AI焦点 daily-report-ai-focus

```
daily-report-ai-focus/
├── src/
│   ├── collectors/
│   │   ├── arxiv.js      # arXiv论文采集
│   │   ├── openai.js     # OpenAI博客采集
│   │   └── huggingface.js # HuggingFace采集
│   ├── processors/
│   │   ├── paper.js      # 论文处理器
│   │   ├── model.js      # 模型更新处理器
│   │   └── research.js   # 研究动态处理器
│   └── generators/
│       ├── research.md   # 研究摘要生成
│       └── model-update.md # 模型更新报告
├── config/
│   └── ai-sources.json   # AI专用数据源
└── output/
    ├── research-digest/  # 研究摘要
    └── model-updates/    # 模型更新
```

### 前端周刊 daily-report-frontend

```
daily-report-frontend/
├── src/
│   ├── collectors/
│   │   ├── npm.js        # NPM趋势采集
│   │   ├── github.js     # GitHub趋势采集
│   │   └── jsweekly.js   # JavaScript周刊
│   ├── processors/
│   │   ├── framework.js  # 框架动态处理
│   │   ├── library.js    # 库更新处理
│   │   └── tool.js       # 工具发布处理
│   └── generators/
│       ├── weekly.md     # 周刊生成
│       └── trend.md      # 趋势报告
├── templates/            # 前端模板
└── output/
    ├── weekly/           # 周刊输出
    └── trends/           # 趋势输出
```

### 安全资讯 daily-report-security

```
daily-report-security/
├── src/
│   ├── collectors/
│   │   ├── cve.js        # CVE漏洞采集
│   │   ├── threatintel.js # 威胁情报采集
│   │   └── securityblog.js # 安全博客采集
│   ├── processors/
│   │   ├── vulnerability.js # 漏洞分析处理
│   │   ├── threat.js     # 威胁分析处理
│   │   └── patch.js      # 补丁更新处理
│   └── generators/
│       ├── security-alert.md # 安全告警
│       └── vulnerability-report.md # 漏洞报告
├── config/
│   └── security-sources.json # 安全专用数据源
└── output/
    ├── alerts/           # 安全告警
    └── reports/          # 漏洞报告
```

---

## 选择建议

| 场景 | 推荐版本 | 主要考虑 |
|------|----------|----------|
| 个人学习 | basic | 简单易用，快速上手 |
| 小团队 | advanced | 功能丰富，扩展性好 |
| 企业应用 | enterprise | 安全可靠，支持大规模 |
| AI研究 | ai-focus | 专业领域，深度定制 |
| 前端开发 | frontend | 社区活跃，资源丰富 |
| 安全运维 | security | 及时预警，专业分析 |

## 目录命名规范

- **kebab-case**: 使用小写字母和连字符
- **语义化**: 目录名要能表达清楚用途
- **一致性**: 同一项目的命名风格要统一
- **简洁性**: 避免过长的目录名

## 文件组织原则

1. **按功能分组**: 相关文件放在同一目录
2. **分离关注点**: 配置、源码、测试分离
3. **版本控制**: 生成的文件与源码分离
4. **环境适配**: 不同环境的配置分离