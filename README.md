# Daily Report Project Creator

🚀 自动化创建基于LLM的日报生成项目工具

## 功能特性

- 🎯 **项目模板生成** - 一键创建完整的日报项目结构
- 🤖 **多LLM支持** - 支持OpenAI、Anthropic、Gemini等主流LLM
- 📧 **邮件集成** - 内置nodemailer 8.x安全邮件发送
- 📊 **数据持久化** - SQLite数据库存储日报数据，零配置部署
- 🕐 **定时任务** - 自动生成和发送日报
- 🐳 **Docker支持** - 容器化部署支持
- 🧪 **完整测试** - 单元测试覆盖
- 🔒 **安全优先** - 修复已知安全漏洞

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/yang9112/daily-report-project-creator.git
cd daily-report-project-creator

# 安装依赖
npm install

# 全局安装
npm install -g .
```

### 创建新项目

#### 交互式创建
```bash
npx create-daily-report
```

#### 批量创建
```bash
# 创建配置文件 batch-config.json
npx create-batch batch-config.json
```

#### 验证项目
```bash
npx validate-project /path/to/your/project
```

## 配置选项

### 项目配置
```json
{
  "projectName": "my-daily-report",
  "description": "我的自动化日报系统",
  "llmProvider": "openai",
  "features": ["email", "llm", "database", "scheduler", "docker", "testing"]
}
```

### 环境变量
```bash
# LLM配置
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# 数据库配置
DB_PATH=./data/daily_report.db
```

## 安全更新

### 🔒 nodemailer 安全修复
- ✅ **版本更新**: 从v7.0.10升级到v8.0.1+
- ✅ **漏洞修复**: 修复DoS漏洞 (CVE-2023-28155)
- ✅ **兼容性测试**: 确保邮件功能正常

### 其他安全措施
- 🔐 环境变量管理敏感信息
- 🛡️ 输入验证和清理
- 📋 依赖安全审计
- 🔍 代码安全扫描

## 项目结构

```
your-daily-report/
├── src/
│   ├── app.js              # 主应用入口
│   ├── services/
│   │   ├── llm-service.js  # LLM集成服务
│   │   ├── email-service.js # 邮件服务 (安全版本)
│   │   └── database-service.js # SQLite数据库服务
│   └── utils/
│       ├── config.js       # 配置管理
│       └── logger.js       # 日志工具
├── templates/              # 日报模板
├── tests/                  # 测试文件
├── scripts/               # 工具脚本
├── docs/                  # 文档
├── data/                  # SQLite数据库文件
└── config/                # 配置文件
```

## 使用指南

### 1. 创建项目
```bash
# 创建新项目
npx daily-report-create my-project --llmProvider openai --features email,database

# 交互式创建
npx daily-report-create
```

### 2. 配置项目
```bash
cd my-project

# 复制配置文件
cp config/config.example.json config/config.json
cp config/sources.example.json config/sources.json

# 编辑配置
nano config/config.json  # 设置API密钥
nano config/sources.json  # 配置RSS源
```

### 3. 初始化数据库
```bash
npm run setup
```

### 4. 运行项目
```bash
# 完整运行
npm start

# 仅采集文章
npm run collect

# 仅��理文章
npm run process

# 生成日报
npm run digest

# 发送邮件
npm run send
```

## API 使用

### 基本用法
```javascript
const DailyReportCreator = require('./src/app');

const creator = new DailyReportCreator();

// 采集新文章
await creator.collectArticles();

// 处理文章并生成摘要
await creator.processArticles();

// 生成日报
await creator.generateDigest();
```

### 自定义配置
```javascript
const creator = new DailyReportCreator({
  llm: {
    provider: 'openai',
    apiKey: 'your-api-key',
    model: 'gpt-3.5-turbo'
  },
  database: {
    path: './data/my_reports.db'
  },
  email: {
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      user: 'your-email@gmail.com',
      pass: 'your-password'
    }
  }
});
```

## 部署方案

### 本地部署
```bash
npm install -g daily-report-project-creator
daily-report-create my-report
cd my-report
npm install && npm run setup
npm start
```

### Docker 部署
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run setup

CMD ["npm", "start"]
```

```bash
# 构建镜像
docker build -t daily-report .

# 运行容器
docker run -d \
  --name daily-report \
  -v $(pwd)/data:/app/data \
  -e OPENAI_API_KEY=your-key \
  daily-report
```

### Cron 定时任务
```bash
# 编辑 crontab
crontab -e

# 每天早上9点运行
0 9 * * * cd /path/to/your/project && npm start
```

## 故障排除

### 常见问题

#### 1. SQLite数据库问题
```bash
# 检查数据库文件权限
ls -la ./data/daily_report.db

# 重新初始化数据库
rm ./data/daily_report.db
npm run setup
```

#### 2. LLM API调用失败
```bash
# 检查API密钥
echo $OPENAI_API_KEY

# 测试API连接
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### 3. 邮件发送失败
```bash
# 检查SQLite数据库文件
ls -la ./data/daily_report.db

# 确保data目录存在且有写权限
mkdir -p ./data
chmod 755 ./data
```

### 日志查看
```bash
# 查看详细日志
DEBUG=* npm start

# 查看错误日志
tail -f ./logs/error.log
```

## 开发指南

### 本地开发
```bash
# 克隆项目
git clone https://github.com/yang9112/daily-report-project-creator.git
cd daily-report-project-creator

# 安装依赖
npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 创建测试项目
npm run test:create
```

### 贡献指南
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

### 编码规范
- 使用 ESLint 进行代码检查
- 遵循 Standard.js 风格 guide
- 编写单元测试
- 更新相关文档

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献者

- [yang9112](https://github.com/yang9112) - 项目维护者

## 更新日志

### v1.0.0 (2026-03-02)
- ✅ 初始版本发布
- ✅ 支持多LLM集成
- ✅ SQLite数据库存储
- ✅ 邮件发送功能
- ✅ Docker支持
- ✅ 安全漏洞修复

### v0.9.0 (2026-03-01)
- ✅ 国际化支持
- ✅ 批量项目创建
- ✅ 完整测试覆盖
- ✅ CI/CD集成

## 支持

- 📖 [文档](https://github.com/yang9112/daily-report-project-creator/wiki)
- 🐛 [问题反馈](https://github.com/yang9112/daily-report-project-creator/issues)
- 💬 [讨论区](https://github.com/yang9112/daily-report-project-creator/discussions)

---

**🚀 让日报生成更智能，让信息获取更高效！**