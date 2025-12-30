# ===== 构建阶段（Build Stage） =====
# 这一阶段只用来编译你的 Vue 项目，生成最终的静态文件
FROM node:20.19.0-alpine AS builder

# 设置工作目录（容器内的路径）
WORKDIR /app

# 将你的项目文件复制到容器内
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --prefer-offline --no-audit

# 复制整个项目源代码
COPY . .

# 构建项目（输出到 dist 文件夹）
RUN npm run build


# ===== 运行阶段（Runtime Stage） =====
# 这一阶段只包含 Nginx + 编译好的文件，体积会小很多
FROM nginx:alpine

# 移除 Nginx 默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置（稍后会创建）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制编译好的文件到 Nginx 服务目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口 80（容器内部使用）
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
