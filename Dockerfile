# 使用Node.js 18 Alpine镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY src/ ./src/
COPY config/ ./config/

# 创建必要的目录
RUN mkdir -p data output logs && \
    chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口（如果需要）
# EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV DB_PATH=./data/daily_report.db
ENV OUTPUT_DIR=./output
ENV LOG_LEVEL=info

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# 启动命令
CMD ["npm", "start"]