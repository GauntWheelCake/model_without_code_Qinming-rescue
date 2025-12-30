# 📦 Docker 离线分发快速指南

## 🎯 适用场景

- ✅ 同事在内网环境（无法访问外网）
- ✅ 公司有安全限制（不能用 Docker Hub）
- ✅ 网络很慢（本地传输更快）
- ✅ 需要给多个同事分发（节省流量）

---

## 👨‍💻 **你（开发者）的操作**

### 第 1 步：构建镜像

```powershell
cd ai-lowcode
docker build -t ai-lowcode:latest .
```

### 第 2 步：导出为 tar 包

```powershell
# 方式 1：导出为 .tar（未压缩，150-300MB）
docker save -o ai-lowcode.tar ai-lowcode:latest

# 方式 2：导出为 .tar.gz（压缩，50-100MB，推荐！）
docker save ai-lowcode:latest | gzip > ai-lowcode.tar.gz
```

**💡 推荐使用 .tar.gz**，文件小 2-3 倍！

### 第 3 步：传给同事

通过以下方式之一：
- 📀 U盘
- 📁 共享文件夹（局域网）
- 📧 邮件（如果文件不大）
- ☁️ 内网文件服务器
- 💾 FTP/SFTP

---

## 👨‍🔧 **同事的操作**

### 第 1 步：确保有 Docker

```powershell
# 检查 Docker 是否安装
docker --version

# 如果没有，下载安装 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

### 第 2 步：加载镜像

```powershell
# 如果是 .tar 文件
docker load -i ai-lowcode.tar

# 如果是 .tar.gz 文件
docker load -i ai-lowcode.tar.gz
```

**输出示例：**
```
Loaded image: ai-lowcode:latest
```

### 第 3 步：验证镜像

```powershell
# 查看镜像列表
docker images

# 应该能看到：
# REPOSITORY     TAG       IMAGE ID       CREATED        SIZE
# ai-lowcode     latest    abc123def456   2 hours ago    150MB
```

### 第 4 步：运行容器

```powershell
# 运行在 8080 端口（可以改成其他端口）
docker run -d -p 8080:80 --name ai-lowcode ai-lowcode:latest
```

### 第 5 步：访问应用

打开浏览器访问：**http://localhost:8080**

---

## 🆚 **在线 vs 离线对比**

| 项目     | 在线（Docker Hub） | 离线（tar 包） |
| -------- | ------------------ | -------------- |
| 需要网络 | ✅ 是               | ❌ 否           |
| 传输方式 | 互联网下载         | 本地文件       |
| 文件大小 | -                  | 50-300MB       |
| 安全性   | 经过公网           | 内网传输       |
| 适用场景 | 有外网             | 内网/离线      |
| 更新频率 | 随时拉取           | 需重新分发     |

---

## 📝 **完整命令速查**

### 开发者（导出）

```powershell
# 1. 构建
docker build -t ai-lowcode:latest .

# 2. 导出（压缩）
docker save ai-lowcode:latest | gzip > ai-lowcode.tar.gz

# 3. 传给同事（选择合适的方式）
```

### 同事（导入）

```powershell
# 1. 加载镜像
docker load -i ai-lowcode.tar.gz

# 2. 查看镜像
docker images | findstr ai-lowcode

# 3. 运行容器
docker run -d -p 8080:80 --name ai-lowcode ai-lowcode:latest

# 4. 访问
# http://localhost:8080
```

---

## ❓ **常见问题**

### Q1: tar.gz 和 tar 有什么区别？

- **tar**：未压缩，150-300MB
- **tar.gz**：gzip 压缩，50-100MB（推荐）

**建议：** 用 `.tar.gz`，文件小，传输快！

### Q2: 如何查看 tar 包大小？

```powershell
# Windows PowerShell
Get-Item ai-lowcode.tar.gz | Select-Object Name, Length

# 或者直接在文件管理器查看
```

### Q3: 加载时报错怎么办？

```powershell
# 检查 Docker 是否运行
docker ps

# 如果 Docker 没启动，启动 Docker Desktop
```

### Q4: 如何更新镜像？

1. **开发者：** 重新构建并导出新的 tar 包
2. **同事：**
   ```powershell
   # 停止旧容器
   docker stop ai-lowcode
   docker rm ai-lowcode
   
   # 删除旧镜像
   docker rmi ai-lowcode:latest
   
   # 加载新镜像
   docker load -i ai-lowcode-new.tar.gz
   
   # 重新运行
   docker run -d -p 8080:80 --name ai-lowcode ai-lowcode:latest
   ```

### Q5: 能同时用在线和离线吗？

可以！两种方式可以并存：
- **在线：** 推送到 Docker Hub，方便有网的同事
- **离线：** 导出 tar 包，给内网同事

### Q6: 多个同事需要多个 tar 包吗？

❌ **不需要！** 一个 tar 包可以给所有同事用。

---

## 🚀 **最佳实践**

1. ✅ **用 .tar.gz** 而不是 .tar（小 2-3 倍）
2. ✅ **给 tar 包加版本号**：`ai-lowcode-v1.0.tar.gz`
3. ✅ **提供 README**：告诉同事如何加载和运行
4. ✅ **测试一下**：自己先 `docker load` 测试能否正常运行
5. ✅ **记录端口**：告诉同事用哪个端口访问

---

## 📊 **文件传输时间估算**

| 方式           | 文件大小 | 传输时间   |
| -------------- | -------- | ---------- |
| U盘 (USB 3.0)  | 100MB    | ~5-10秒    |
| 局域网 (1Gbps) | 100MB    | ~1秒       |
| 百度网盘       | 100MB    | 1-5分钟    |
| 邮件附件       | 100MB    | 可能不支持 |

**建议：** U盘或局域网最快！

---

## 🎓 **下一步**

导出成功后，可以：
1. ✅ 给同事发送 tar 包
2. ✅ 附上这个快速指南
3. ✅ 告诉同事访问端口（比如 8080）
4. ✅ 提供技术支持（如果有问题）

**完成！🎉 你的同事现在可以离线运行你的应用了！**
