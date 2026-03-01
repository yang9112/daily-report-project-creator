#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 日报生成器
 * 负责生成格式化的技术日报
 */
class DailyReportGenerator {
  constructor(config = {}) {
    this.outputDir = config.outputDir || './output';
    this.templateDir = config.templateDir || './templates';
    this.language = config.language || 'zh-CN';
    this.includeStats = config.includeStats !== false;
    this.maxArticles = config.maxArticles || 20;
    this.minRelevanceScore = config.minRelevanceScore || 6;
    
    // 确保输出��录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 生成日报
   */
  async generateReport(articles, options = {}) {
    console.log('📰 开始生成日报...');
    
    // 过滤和排序文章
    const filteredArticles = this.filterArticles(articles);
    const sortedArticles = this.sortArticles(filteredArticles);
    const topArticles = sortedArticles.slice(0, options.maxArticles || this.maxArticles);
    
    // 生成不同格式的报告
    const reportDate = new Date().toLocaleDateString('zh-CN');
    const reportData = {
      date: reportDate,
      generatedAt: new Date().toISOString(),
      articles: topArticles,
      stats: this.calculateStats(articles),
      summary: this.generateSummary(topArticles)
    };

    // 生成Markdown报告
    const markdownReport = await this.generateMarkdownReport(reportData);
    const markdownFilename = `daily-report-${new Date().toISOString().split('T')[0]}.md`;
    await this.saveReport(markdownReport, markdownFilename);

    // 生成HTML报告
    const htmlReport = await this.generateHTMLReport(reportData);
    const htmlFilename = `daily-report-${new Date().toISOString().split('T')[0]}.html`;
    await this.saveReport(htmlReport, htmlFilename);

    // 生成JSON数据
    const jsonFilename = `report-data-${new Date().toISOString().split('T')[0]}.json`;
    await this.saveReport(reportData, jsonFilename);

    console.log(`✅ 日报生成完成，共收录 ${topArticles.length} 篇文章`);
    return {
      markdown: path.join(this.outputDir, markdownFilename),
      html: path.join(this.outputDir, htmlFilename),
      json: path.join(this.outputDir, jsonFilename),
      data: reportData
    };
  }

  /**
   * 过滤文章
   */
  filterArticles(articles) {
    return articles.filter(article => {
      if (!article.summary || article.summary === '处理失败') return false;
      if (article.relevanceScore < this.minRelevanceScore) return false;
      if (!article.title || !article.link) return false;
      return true;
    });
  }

  /**
   * 排序文章
   */
  sortArticles(articles) {
    return articles.sort((a, b) => {
      // 首先按相关度排序
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // 然后按发布时间排序
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
  }

  /**
   * 计算统计信息
   */
  calculateStats(articles) {
    const sources = {};
    const categories = {};
    const keywordCount = {};

    articles.forEach(article => {
      // 统计来源
      sources[article.source] = (sources[article.source] || 0) + 1;
      
      // 统计分类
      categories[article.category] = (categories[article.category] || 0) + 1;
      
      // 统计关键词
      if (article.keywords) {
        article.keywords.forEach(keyword => {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        });
      }
    });

    return {
      total: articles.length,
      sources: Object.entries(sources).sort((a, b) => b[1] - a[1]),
      categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
      topKeywords: Object.entries(keywordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
  }

  /**
   * 生成摘要
   */
  generateSummary(articles) {
    if (articles.length === 0) return '今日暂无优质技术文章推荐。';

    const topKeywords = this.getTopKeywords(articles, 5);
    const categories = [...new Set(articles.map(a => a.category))];
    
    return `今日精选 ${articles.length} 篇优质技术文章，涵盖${categories.join('、')}等领域。热门关键词：${topKeywords.join('、')}。`;
  }

  /**
   * 获取Top关键词
   */
  getTopKeywords(articles, limit = 10) {
    const keywordCount = {};
    
    articles.forEach(article => {
      if (article.keywords) {
        article.keywords.forEach(keyword => {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        });
      }
    });

    return Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword]) => keyword);
  }

  /**
   * 生成Markdown报告
   */
  async generateMarkdownReport(reportData) {
    const { date, articles, stats, summary } = reportData;
    
    let markdown = `# 技术日报 - ${date}

> 生成时间：${new Date().toLocaleString('zh-CN')}

## 📋 今日概览

${summary}

**统计信息：**
- 📊 总文章数：${stats.total}
- 📈 相关文章：${articles.length}
- 🔥 热门关键词：${stats.topKeywords.map(([kw, count]) => `${kw}(${count})`).join('、')}

---

## 📰 精选文章

`;

    articles.forEach((article, index) => {
      markdown += `### ${index + 1}. ${article.title}

**来源：** ${article.source}  
**发布时间：** ${new Date(article.pubDate).toLocaleDateString('zh-CN')}  
**相关度：** ⭐ ${article.relevanceScore}/10  
**情感倾向：** ${article.sentiment || '中性'}  
**关键词：** ${article.keywords.join('、')}

**摘要：** ${article.summary}

**详情链接：** [阅读原文](${article.link})

---

`;
    });

    // 添加详细统计
    if (this.includeStats) {
      markdown += `## 📊 详细统计

### 文章来源分布
${stats.sources.map(([source, count]) => `- **${source}**：${count} 篇`).join('\n')}

### 分类统计
${stats.categories.map(([category, count]) => `- **${category}**：${count} 篇`).join('\n')}

### 热门关键词 Top 10
${stats.topKeywords.map(([keyword, count]) => `${index + 1}. ${keyword} (${count} 次)`).join('\n')}

---

`;
    }

    markdown += `## 📝 说明

本报告由 AI 自动生成，基于以下标准：
- 🎯 仅包含相关度 ≥ ${this.minRelevanceScore} 的文章
- 📝 内容经过 AI 摘要和关键词提取
- 🔗 所有链接均指向原文

**技术栈：** 本报告使用 Node.js、RSS采集、AI摘要等技术自动生成。

---

*Generated by Daily Report Generator*`;

    return markdown;
  }

  /**
   * 生成HTML报告
   */
  async generateHTMLReport(reportData) {
    const { date, articles, stats, summary } = reportData;
    
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>技术日报 - ${date}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #007bff; margin-top: 30px; }
        h3 { color: #333; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .article { border: 1px solid #e9ecef; padding: 20px; margin: 20px 0; border-radius: 8px; background: #fafafa; }
        .article h3 { margin-top: 0; color: #007bff; }
        .meta { color: #666; font-size: 0.9em; margin: 10px 0; }
        .keywords { background: #e9ecef; padding: 5px 10px; border-radius: 15px; font-size: 0.8em; display: inline-block; margin: 2px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .relevance { color: #28a745; font-weight: bold; }
        .sentiment { padding: 2px 8px; border-radius: 3px; font-size: 0.8em; }
        .sentiment.正面 { background: #d4edda; color: #155724; }
        .sentiment.中性 { background: #fff3cd; color: #856404; }
        .sentiment.负面 { background: #f8d7da; color: #721c24; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>技术日报 - ${date}</h1>
        
        <div class="metadata">
            <p><strong>生成时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
            <p><strong>今日概览：</strong>${summary}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>📊 统计信息</h3>
                <p>总文章数：${stats.total}</p>
                <p>相关文章：${articles.length}</p>
                <p>热门关键词：${stats.topKeywords.map(([kw]) => kw).join('、')}</p>
            </div>
        </div>
        
        <h2>📰 精选文章</h2>
        
        ${articles.map((article, index) => `
        <div class="article">
            <h3>${index + 1}. ${article.title}</h3>
            <div class="meta">
                <p><strong>来源：</strong>${article.source} | 
                   <strong>发布时间：</strong>${new Date(article.pubDate).toLocaleDateString('zh-CN')} | 
                   <strong>相关度：</strong><span class="relevance">⭐ ${article.relevanceScore}/10</span> |
                   <strong>情感倾向：</strong><span class="sentiment ${article.sentiment}">${article.sentiment || '中性'}</span></p>
                <p><strong>关键词：</strong>${article.keywords.map(kw => `<span class="keywords">${kw}</span>`).join(' ')}</p>
            </div>
            <p><strong>摘要：</strong>${article.summary}</p>
            <p><strong>详情链接：</strong><a href="${article.link}" target="_blank">阅读原文</a></p>
        </div>
        `).join('')}
        
        <div class="metadata">
            <p><em>Generated by Daily Report Generator</em></p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * 保存报告
   */
  async saveReport(content, filename) {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, content);
    console.log(`💾 报告已保存: ${filepath}`);
    return filepath;
  }

  /**
   * 生成邮件摘要
   */
  generateEmailSummary(reportData) {
    const { date, articles, summary } = reportData;
    
    let email = `📰 技术日报 - ${date}

${summary}

📋 今日精选文章：
`;

    articles.slice(0, 5).forEach((article, index) => {
      email += `
${index + 1}. ${article.title}
📝 ${article.summary}
🔗 ${article.link}
`;
    });

    email += `
📊 详���报告请查看附件
💻 网页版：${this.generateWebReportLink(reportData)}

Generated by Daily Report Generator`;

    return email;
  }

  /**
   * 生成网页版链接
   */
  generateWebReportLink(reportData) {
    // 这里可以集成到实际的网页系统
    return `https://your-domain.com/reports/${new Date().toISOString().split('T')[0]}`;
  }
}

module.exports = DailyReportGenerator;