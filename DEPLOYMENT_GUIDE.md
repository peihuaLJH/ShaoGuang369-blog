# 博客网站部署指南

## 域名配置
域名：https://shaoguang369.top

## 推荐部署方案

### 方案一：Railway (推荐 - 全栈支持)
1. 注册 Railway 账号
2. 连接 GitHub 仓库
3. 自动部署前端和后端
4. 配置环境变量
5. 绑定自定义域名

### 方案二：Vercel + Railway
- Vercel 部署前端 (React)
- Railway 部署后端 (Express)
- 配置 API 代理

### 方案三：单个云服务器
- 购买 VPS (DigitalOcean, Linode等)
- 配置 Nginx 反向代理
- 部署前后端
- 配置 SSL 证书

## 当前项目结构
- 前端：React 应用 (端口 3007)
- 后端：Express API (端口 5000)
- 数据库：MongoDB (当前使用内存存储)

## 部署步骤

### 1. 准备生产环境配置

需要修改以下文件以支持生产环境：

#### backend/package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### frontend/package.json
```json
{
  "homepage": "https://shaoguang369.top",
  "scripts": {
    "build": "react-scripts build",
    "start": "serve -s build -l 3000"
  }
}
```

### 2. 环境变量配置

创建 `.env` 文件：
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog
JWT_SECRET=your-secret-key
```

### 3. 构建优化

- 启用代码分割
- 配置 CDN
- 压缩静态资源

## SSL 配置

域名使用 HTTPS，需要配置 SSL 证书：
- Let's Encrypt (免费)
- Cloudflare (推荐)
- 部署平台自动配置

## 监控和维护

- 设置错误日志
- 配置备份
- 性能监控