# 🚀 Docker 快速参考

## 你现在的位置：`ai-lowcode` 目录

---

## 📋 **一句话检查清单**

- [ ] 安装了 Docker Desktop
- [ ] 在项目目录运行：`docker build -t ai-lowcode:latest .`
- [ ] 本地测试：`docker run -d -p 3000:80 --name ai-lowcode-test ai-lowcode:latest`
- [ ] 访问 http://localhost:3000 ✅
- [ ] 创建了 Docker Hub 账户
- [ ] 运行了 `docker login`
- [ ] 重新标记镜像：`docker tag ai-lowcode:latest <用户名>/ai-lowcode:latest`
- [ ] 推送到 Docker Hub：`docker push <用户名>/ai-lowcode:latest`

---

## 🎯 **最常用的 5 个命令**

```bash
# 1️⃣ 构建镜像（开发者做一次）
docker build -t ai-lowcode:latest .

# 2️⃣ 本地测试（开发者测试）
docker run -d -p 3000:80 --name ai-lowcode ai-lowcode:latest

# 3️⃣ 推送到 Docker Hub（开发者做一次）
docker push <用户名>/ai-lowcode:latest

# 4️⃣ 同事拉取（同事做一次）
docker pull <用户名>/ai-lowcode:latest

# 5️⃣ 同事运行（同事根据需求调整端口）
docker run -d -p 8080:80 --name ai-lowcode <用户名>/ai-lowcode:latest
```

---

## 🔍 **故障排查三步走**

```bash
# Step 1：容器在运行吗？
docker ps

# Step 2：看看容器日志
docker logs ai-lowcode

# Step 3：映射的端口对吗？
docker inspect ai-lowcode
```

---

## 📂 **新增文件说明**

| 文件                  | 作用                                 |
| --------------------- | ------------------------------------ |
| `Dockerfile`          | 告诉 Docker 怎么构建镜像（最重要！） |
| `nginx.conf`          | Nginx 配置（提供静态文件服务）       |
| `.dockerignore`       | 构建时忽略的文件（加快构建）         |
| `DOCKER_GUIDE.md`     | 详细指南（你现在看的东西）           |
| `DOCKER_QUICK_REF.md` | 快速参考（就是这个）                 |

---

## 💡 **核心概念速记**

- 🖼️ **镜像** = 软件光盘（不可变）
- 📦 **容器** = 运行中的应用（可以启动/停止）
- 🐳 **Docker Hub** = 镜像的仓库（像 GitHub 一样）
- 🔌 **端口映射** = `docker run -p <主机端口>:<容器端口>`

---

## ✨ **为什么这样设计？**

**多阶段构建的好处：**
```
Dockerfile 第一部分（Node.js）→ 编译 → dist 文件夹
                      ↓
                  丢掉这一部分
                      ↓
Dockerfile 第二部分（Nginx）  → 只含 dist + Nginx
                      ↓
                   最终镜像小！快！安全！
```

**结果：** 镜像从 1.5GB 缩小到 150MB 左右 🚀

---

## 🎓 **学习路径**

1. **现在：** 跟我的步骤走一遍
2. **下一步：** 推送到 Docker Hub
3. **后续：** 同事拉取并运行
4. **进阶：** 学习 Docker Compose（多容器编排）

---

## 📞 **需要帮助？**

常见问题见 `DOCKER_GUIDE.md` 的 "常见问题" 部分。

有任何卡壳的地方直接问我！🙂
