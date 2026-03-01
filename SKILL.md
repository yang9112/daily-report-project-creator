---
name: daily-report-skill-creator
description: 基于KISS原则设计的技术博客自动采集和AI摘要系统，每日生成高质量技术阅读简报。
---

# 技术博客日报系统开源项目创建器 📰

## 🎯 核心价值
将现有的技术博客日报技能打包成独立的开源项目，实现一键式GitHub发布。

# 技术博客日报系统 (TechDaily Digest) 📰

## 🎯 核心价值
基于KISS原则设计的技术博客自动采集和AI摘要系统，每日生成高质量技术阅读简报。

## 🚀 核心特性
- **轻量级架构**: SQLite数据库，零配置部署
- **智能去重**: 基于文章链接自动去重
- **AI摘要**: 自动提取核心观点和关键词
- **模块化设计**: 采集、处理、分发解耦
- **容错机制**: 单源失败不影响整体运行

## 🏗️ 系统架构
```
配置文件 → 采集器 → SQLite数据库 → 处理器 → AI摘要 → 日报生成
```

## 📊 数据库设计
### sources表 - 订阅源管理
- id (主键) | name (博客名称) | feed_url (RSS地址) | last_checked | is_active

### articles表 - 文章库
- id (主键) | source_id | title | link (唯一索引) | published_at | raw_content | summary | status

## 🛠️ 使用方法

### 1. 初始化配置
```bash
cd /root/workspace/skills/tech-daily-digest
# 安装依赖
npm install

# 初始化数据库
node setup.js

# 配置RSS源
cp config/sources.example.json config/sources.json
# 编辑添加你的技术博客RSS源
```

### 2. 配置AI服务
```bash
# 编辑AI配置
cp config/config.example.json config/config.json
# 设置你的OpenAI/DeepSeek API密钥
```

### 3. 运行系统
```bash
# 完整运行（采集+处理+生成）
npm start

# 仅采集新文章
npm run collect

# 仅处理待处理文章  
npm run process

# 生成今日日报
npm run digest
```

## ⚙️ 配置文件格式

### sources.json - RSS源配置
```json
{
  "sources": [
    {
      "name": "美团技术团队",
      "feed_url": "https://tech.meituan.com/feed",
      "is_active": true
    }
  ]
}
```

### config.json - 系统配置
```json
{
  "database": {
    "path": "./data/tech_daily.db"
  },
  "llm": {
    "provider": "openai",
    "api_key": "your-api-key",
    "model": "gpt-3.5-turbo"
  },
  "digest": {
    "limit_articles": 10,
    "output_dir": "./output"
  }
}
```

## 📈 工作流程

### 采集阶段
1. 读取活跃RSS源
2. 解析Feed内容
3. 去重检查（基于link）
4. 存储新文章（status: 'new'）

### 处理阶段
1. 获取待处理文章（status: 'new'）
2. 调用AI生成摘要
3. 提取关键词
4. 更新状态（status: 'processed'）

### 生成阶段
1. 汇总已处理文章
2. 按日期组织
3. 生成Markdown日报
4. 可选：发送邮件通知

## 🎯 AI摘要Prompt
```
请用中文一句话总结这篇技术文章的核心观点（50字以内），并提取3个关键词。
```

## 🗂️ 输出格式

### 日报模板（Markdown）
```markdown
# 技术日报 - 2026-02-26

## 📊 今日概览
- 采集文章：15篇
- 处理完成：12篇
- 高质量文章：3篇

## 🔥 必读推荐
1. [文章标题](链接) - 核心观点摘要
   关键词：关键词1, 关键词2, 关键词3

## 📈 技术趋势
- 按关键词统计今日热点

## 📚 全文列表
[今日所有采集文章]
```

## 🚀 部署建议

### 本地开发
直接运行：`npm start`

### 服务器定时任务
```bash
# 添加到crontab，每���9点运行
0 9 * * * cd /root/workspace/skills/tech-daily-digest && npm start
```

### GitHub Actions
1. 定时触发workflow
2. 执行采集和处理
3. 提供SQLite数据库更新
4. 发布日报文件

## 📦 依赖包
- `sqlite3`: 数据库操作
- `feedparser`: RSS解析
- `axios`: HTTP请求
- `openai`: AI接口调用
- `node-cron`: 定时任务（可选）

## 🔄 扩展性
- **新增源**: 直接编辑sources.json
- **更换AI**: 修改config.json中的provider
- **输出格式**: 支持Markdown/HTML/JSON
- **通知方式**: 邮件/企业微信/飞书

## 📝 注意事项
- 首次运行需要初始化数据库
- 建议设置合理的API调用限制
- 定期清理过期数据避免数据库膨胀
- 监控RSS源有效性，及时更新失效源

---

**🤖 让技术阅读更高效，让信息获取更智能**