# ===== 构建阶段（Build Stage）=====
# 使用 Node.js 镜像来安装依赖并构建前端产物
FROM node:20.19.0-alpine AS builder

# 容器内的工作目录
WORKDIR /app

# 先复制依赖清单，便于利用 Docker 缓存
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --prefer-offline --no-audit --no-fund

# 复制项目源码
COPY . .

# 构建生产环境静态文件，输出到 dist/
RUN npm run build


# ===== 运行阶段（Runtime Stage）=====
# 只保留 Nginx 和最终构建产物，减少运行镜像体积
FROM nginx:1.29-alpine AS runtime

# 删除默认站点配置，改用项目自定义配置
RUN rm /etc/nginx/conf.d/default.conf

# 拷贝 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 仅从构建阶段复制最终产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露容器 80 端口
EXPOSE 80

# 提供最小健康检查，方便后续部署平台探活
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
