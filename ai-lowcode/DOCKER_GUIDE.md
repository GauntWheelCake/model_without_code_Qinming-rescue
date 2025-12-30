# Docker 部署指南

## 🎯 概览

这个项目已经完全 Docker 化。你可以在任何装有 Docker 的机器上运行它，而不需要安装 Node.js。

---

## 📦 **开发者（你）要做的事**

### 第 1 步：安装 Docker

**Windows：**
- 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- 安装并启动

**Mac/Linux：**
- 按官方文档安装 Docker

### 第 2 步：构建镜像

打开终端，进入项目目录，运行：

```bash
# 进入项目目录
cd ai-lowcode

# 构建镜像
docker build -t ai-lowcode:latest .
```

**这个命令做了什么？**
- `-t ai-lowcode:latest`：给镜像取个名字 `ai-lowcode`，标签是 `latest`（最新版本）
- `.`：当前目录就是 Dockerfile 所在的位置

**第一次可能需要 2-5 分钟**（取决于网速和机器性能），后续会更快。

### 第 3 步：本地测试

在推送到 Docker Hub 之前，先在本地测试一下：

```bash
# 运行容器（测试用）
# -d: 后台运行
# -p 3000:80: 把容器的 80 端口映射到你电脑的 3000 端口
# --name: 给容器起个名字
docker run -d -p 3000:80 --name ai-lowcode-test ai-lowcode:latest

# 然后访问：http://localhost:3000
```

**如果成功了，看到你的应用，那就对了！**

### 第 4 步：停止和清理容器

```bash
# 停止容器
docker stop ai-lowcode-test

# 删除容器
docker rm ai-lowcode-test
```

### 第 5 步：推送到 Docker Hub

#### 5.1 创建 Docker Hub 账户

- 访问 https://hub.docker.com
- 注册一个免费账户
- 记住你的用户名（例如：`your-username`）

#### 5.2 登录 Docker

```bash
# 在终端登录
docker login

# 输入你的用户名和密码
# 成功后会看到 "Login Succeeded"
```

#### 5.3 给镜像重新标记

```bash
# 格式：docker tag <本地镜像> <用户名>/<镜像名>:<版本>
# 例如我的用户名是 myusername
docker tag ai-lowcode:latest myusername/ai-lowcode:latest

# 建议也标记一个 latest
docker tag ai-lowcode:latest myusername/ai-lowcode:v1.0
```

#### 5.4 推送到 Docker Hub

```bash
# 推送到 Docker Hub
docker push myusername/ai-lowcode:latest
```

**这需要几分钟**，取决于镜像大小和网速。完成后你就可以在 Docker Hub 上看到这个镜像了！

---

## � **离线分发（同事没有网络时）**

如果你的同事**无法访问 Docker Hub**（离线环境、内网），可以将镜像导出为 tar 包：

### 方式 A：导出镜像为 tar 包

#### 你（开发者）这边：

```bash
# 1. 构建或确保镜像存在
docker images | grep ai-lowcode

# 2. 导出镜像为 tar 文件
docker save -o ai-lowcode.tar ai-lowcode:latest

# 或者压缩一下（推荐，文件会小很多）
docker save ai-lowcode:latest | gzip > ai-lowcode.tar.gz
```

**文件大小：**
- `.tar`：约 150-300MB（未压缩）
- `.tar.gz`：约 50-100MB（压缩后，推荐）

#### 同事那边：

```bash
# 1. 把 tar 包复制到同事的电脑（U盘、网盘、FTP等）

# 2. 加载镜像
# 如果是 .tar 文件
docker load -i ai-lowcode.tar

# 如果是 .tar.gz 文件
docker load -i ai-lowcode.tar.gz
# 或者
gunzip -c ai-lowcode.tar.gz | docker load

# 3. 验证镜像已加载
docker images | grep ai-lowcode

# 4. 运行容器（跟在线方式一样）
docker run -d -p 8080:80 --name ai-lowcode ai-lowcode:latest
```

### 方式 B：通过 USB 或内网传输

```bash
# 开发者：导出并传输
docker save ai-lowcode:latest | gzip > ai-lowcode.tar.gz
# 然后通过 U盘、共享文件夹等方式传给同事

# 同事：加载并运行
gunzip -c ai-lowcode.tar.gz | docker load
docker run -d -p 8080:80 --name ai-lowcode ai-lowcode:latest
```

### 💡 **离线分发的优势**

| 优势         | 说明                       |
| ------------ | -------------------------- |
| 🚫 不需要网络 | 内网环境、无外网权限也能用 |
| 🔒 安全       | 不经过公网，适合企业内部   |
| ⚡ 更快       | 大文件本地传输比网络下载快 |
| 💰 省流量     | 多个同事只需一个 tar 包    |

---

## 🚀 **同事那边要做的事（在线方式）**

### 第 1 步：安装 Docker

同事也需要装 Docker Desktop（见上面的步骤）

### 第 2 步：拉取镜像

```bash
# 从 Docker Hub 拉取你的镜像
# 格式：docker pull <用户名>/<镜像名>:<版本>
docker pull myusername/ai-lowcode:latest
```

### 第 3 步：运行容器（关键！端口自定义在这里）

```bash
# 基础命令
docker run -d -p <自定义端口>:80 --name ai-lowcode myusername/ai-lowcode:latest
```

**常见的端口选项：**

```bash
# 使用 3000 端口
docker run -d -p 3000:80 --name ai-lowcode myusername/ai-lowcode:latest

# 使用 8080 端口
docker run -d -p 8080:80 --name ai-lowcode myusername/ai-lowcode:latest

# 使用 80 端口（需要管理员权限，且如果有其他服务占用会冲突）
docker run -d -p 80:80 --name ai-lowcode myusername/ai-lowcode:latest
```

### 第 4 步：访问应用

假设使用的是 8080 端口，就访问：

```
http://localhost:8080
```

或者如果是服务器部署，用服务器 IP：

```
http://<服务器IP>:8080
```

---

## 🔧 **有用的 Docker 命令**

### 查看运行中的容器

```bash
docker ps

# 查看所有容器（包括已停止的）
docker ps -a
```

### 查看容器日志

```bash
docker logs ai-lowcode
```

### 进入容器（调试用）

```bash
docker exec -it ai-lowcode sh
```

### 停止容器

```bash
docker stop ai-lowcode
```

### 重启容器

```bash
docker restart ai-lowcode
```

### 删除容器

```bash
docker rm ai-lowcode
```

### 删除镜像

```bash
docker rmi myusername/ai-lowcode:latest
```

### 查看镜像大小

```bash
docker images
```

### 导出和导入镜像

```bash
# 导出镜像为 tar 包
docker save -o ai-lowcode.tar ai-lowcode:latest

# 导出并压缩
docker save ai-lowcode:latest | gzip > ai-lowcode.tar.gz

# 加载 tar 包
docker load -i ai-lowcode.tar

# 加载压缩包
gunzip -c ai-lowcode.tar.gz | docker load
```

### 清理磁盘空间

```bash
# 删除未使用的镜像
docker image prune

# 删除所有未使用的资源（容器、镜像、网络、缓存）
docker system prune -a
```

---

## 📊 **镜像结构解释**

你看 Dockerfile，会看到两个关键词：

1. **AS builder**（构建阶段）
   - 使用 Node.js 镜像
   - 安装依赖 (`npm install`)
   - 编译项目 (`npm run build`)
   - 输出到 `dist` 文件夹
   - **这一阶段的所有文件最后都会被丢弃！**

2. **FROM nginx:alpine**（运行阶段）
   - 使用轻量级的 Nginx 镜像
   - 只复制编译好的 `dist` 文件
   - **最终镜像只包含静态文件和 Nginx**

**为什么这样做？**

- ✅ 最终镜像很小（通常 100-200MB）
- ✅ 不包含 Node.js 和源代码，更安全
- ✅ 启动更快，占用内存更少

---

## ❓ **常见问题**

### Q1：忘记登录就推送会怎样？

A：会报错。重新 `docker login` 再推送。

### Q2：镜像太大了怎么办？

A：看 Dockerfile 的多阶段构建有没有正确使用。应该只有 nginx + 静态文件的大小。

### Q3：同事无法拉取镜像怎么办？

A：可能原因：
- 镜像名称不对（确认用户名、镜像名、版本号）
- 网络问题（试试 `docker pull` 多次）
- 权限问题（如果是私有仓库，需要 `docker login`）

### Q4：容器运行了但访问不了怎么办？

A：
```bash
# 1. 检查容器是否真的在运行
docker ps

# 2. 查看容器日志
docker logs ai-lowcode

# 3. 检查端口是否正确映射
docker inspect ai-lowcode | grep -A 5 "Ports"
```

### Q5：想更新代码后重新部署怎么办？

A：
```bash
# 1. 本地修改代码
# 2. 重新构建镜像
docker build -t ai-lowcode:latest .

# 3. 重新标记和推送
docker tag ai-lowcode:latest myusername/ai-lowcode:latest
docker push myusername/ai-lowcode:latest

# 4. 同事拉取新镜像
docker pull myusername/ai-lowcode:latest

# 5. 停止旧容器并运行新容器
docker stop ai-lowcode
docker rm ai-lowcode
docker run -d -p 8080:80 --name ai-lowcode myusername/ai-lowcode:latest
```

---

## 🎓 **学习小贴士**

Docker 的核心就这几个概念：

| 概念                  | 类比         | 说明                                 |
| --------------------- | ------------ | ------------------------------------ |
| **镜像（Image）**     | 软件安装盘   | 一个不可变的模板，包含应用和所有依赖 |
| **容器（Container）** | 已安装的软件 | 镜像运行起来的实例，可以有多个       |
| **Dockerfile**        | 安装说明书   | 告诉 Docker 如何构建镜像             |
| **Docker Hub**        | App Store    | 分享和下载镜像的地方                 |
| **端口映射**          | 防火墙转发   | 把容器内的端口暴露到主机             |

---

## 🚀 **下一步**

现在你已经有了完整的 Docker 设置！

1. ✅ Dockerfile 已创建
2. ✅ nginx.conf 已创建
3. ✅ .dockerignore 已创建
4. ✅ 使用文档已创建

**现在你可以：**

```bash
# 1. 构建镜像
docker build -t ai-lowcode:latest .

# 2. 本地测试
docker run -d -p 3000:80 --name ai-lowcode-test ai-lowcode:latest

# 3. 访问 http://localhost:3000 测试

# 4. 测试通过后，推送到 Docker Hub
docker login
docker tag ai-lowcode:latest <你的用户名>/ai-lowcode:latest
docker push <你的用户名>/ai-lowcode:latest
```

有任何问题随时问我！
