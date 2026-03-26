# Railway 部署配置

## 1. Railway 账号注册
访问 https://railway.app 注册账号

## 2. 连接 GitHub
- 在 Railway 控制台点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 连接您的 GitHub 仓库

## 3. 环境变量配置
在 Railway 项目设置中添加以下环境变量：

```
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret
```

## 4. 自定义域名配置
- 在 Railway 项目设置中找到 "Domains"
- 添加您的域名：shaoguang369.top
- 配置 DNS 记录指向 Railway 提供的 CNAME

## 5. 数据库配置
Railway 支持 MongoDB 数据库：
- 在项目中添加 MongoDB 插件
- 复制连接字符串到环境变量

## 6. 部署验证
部署完成后，访问 https://shaoguang369.top 验证网站正常运行

## 替代方案：Vercel + Railway

如果想分离前后端：

### 前端 (Vercel)
1. 注册 Vercel 账号
2. 连接 GitHub 仓库
3. 自动检测为 React 项目
4. 配置环境变量：
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

### 后端 (Railway)
1. 部署后端到 Railway
2. 配置 CORS 允许 Vercel 域名

## 注意事项
- 确保生产构建没有错误
- 配置适当的错误处理
- 设置监控和日志
- 定期备份数据