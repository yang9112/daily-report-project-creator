# Daily Report Project Creator

🚀 自动化创建基于LLM的日报生成项目工具

## 功能特性

- 🎯 **项目模板生成** - 一键创建完整的日报项目结构
- 🤖 **多LLM支持** - 支持OpenAI、Anthropic、Gemini等主流LLM
- 📧 **邮件集成** - 内置nodemailer 8.x安全邮件发送
- 📊 **数据持久化** - MongoDB集成存储日报数据
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
DATABASE_URL=mongodb://localhost:27017/daily-report
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
│   │   └── database-service.js # 数据库服务
│   └── utils/
│       ├── config.js       # 配置管理
│       └── logger.js       # 日志工具
├── templates/              # 日报模板
├── tests/                  # 测试文件
├── scripts/               # 工具脚本
├── docs/                  # 文档
└── config/                # 配置文件
```

## 验证功能

### 运行验证
```bash
# 验证当前项目
npm run validate

# 运行测试
npm test

# 代码检查
npm run lint
```

### 安全检查
```bash
# 检查依赖安全
npm audit

# 修复安全漏洞
npm audit fix
```

## 故障排除

### 常见问题

#### 1. nodemailer认证失败
```bash
# 检查SMTP配置
# 确保使用应用专用密码而非账户密码
```

#### 2. LLM API调用失败
```bash
# 验证API密钥
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
```

#### 3. 数据库连接问题
```bash
# 检查MongoDB状态
systemctl status mongod
```

## 版本历史

### v1.2.1 (2026-03-02)
- 🔒 修复nodemailer安全漏洞 (升级到v8.0.1+)
- ✅ 增强项目验证功能
- 📝 更新文档和测试
- 🛡️ 加强安全措施

### v1.2.0
- 🎨 改进用户界面
- 📧 新增批量项目创建
- 🧪 增加测试覆盖率
- 🐳 优化Docker支持

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 支持

- 📖 [文档](https://github.com/yang9112/daily-report-project-creator/docs)
- 🐛 [问题反馈](https://github.com/yang9112/daily-report-project-creator/issues)
- 💬 [讨论区](https://github.com/yang9112/daily-report-project-creator/discussions)

---

⭐ 如果这个工具对你有帮助，请给它一个星标！