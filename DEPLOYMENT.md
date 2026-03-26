# 博客网站部署指南

## 1. 服务器准备

### 1.1 选择服务器

推荐选择以下云服务提供商：
- **阿里云**：https://www.aliyun.com/
- **腾讯云**：https://cloud.tencent.com/
- **AWS**：https://aws.amazon.com/
- **DigitalOcean**：https://www.digitalocean.com/

建议配置：
- CPU：2核
- 内存：4GB
- 存储空间：40GB SSD
- 操作系统：Ubuntu 20.04 LTS

### 1.2 服务器初始化

登录服务器后，执行以下命令：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要的软件
apt install -y curl wget git nginx certbot python3-certbot-nginx

# 安装 Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt install -y nodejs

# 验证安装
node -v
npm -v
```

## 2. 数据库设置

### 2.1 安装 MongoDB

```bash
# 导入 MongoDB 公钥
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -

# 添加 MongoDB 源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# 安装 MongoDB
apt update
apt install -y mongodb-org

# 启动 MongoDB 服务
systemctl start mongodb
systemctl enable mongodb

# 验证 MongoDB 运行状态
systemctl status mongodb

# 允许远程连接（可选，用于 Navicat 连接）
nano /etc/mongod.conf
# 将 bindIp 改为 0.0.0.0
# 保存并退出

systemctl restart mongodb

# 开放 MongoDB 端口（可选）
ufw allow 27017/tcp
```

### 2.2 使用 Navicat 创建数据库和用户

#### 2.2.1 下载并安装 Navicat

1. 访问 [Navicat 官网](https://www.navicat.com.cn/download/navicat-premium) 下载 Navicat Premium
2. 安装并启动 Navicat

#### 2.2.2 连接 MongoDB

1. 打开 Navicat，点击 "连接" -> "MongoDB"
2. 填写连接信息：
   - **连接名**：Blog MongoDB
   - **主机**：服务器 IP 地址
   - **端口**：27017
   - **认证方式**：密码
   - **用户名**：admin（默认）
   - **密码**：（默认为空）
3. 点击 "测试连接"，确认连接成功
4. 点击 "确定" 保存连接

#### 2.2.3 创建数据库

1. 在左侧导航栏中，右键点击连接名，选择 "打开连接"
2. 右键点击 "数据库"，选择 "新建数据库"
3. 填写数据库信息：
   - **数据库名**：blog
   - **字符集**：utf8
   - **校对规则**：utf8_general_ci
4. 点击 "确定" 创建数据库

#### 2.2.4 创建用户

1. 展开 "blog" 数据库，右键点击 "用户"，选择 "新建用户"
2. 填写用户信息：
   - **用户名**：bloguser
   - **密码**：yourpassword
   - **确认密码**：yourpassword
3. 在 "权限" 标签页中，选择 "blog" 数据库，勾选 "readWrite" 权限
4. 点击 "保存" 创建用户

#### 2.2.5 验证用户权限

1. 点击 "连接" -> "MongoDB"，创建新的连接
2. 填写连接信息：
   - **连接名**：Blog User
   - **主机**：服务器 IP 地址
   - **端口**：27017
   - **认证方式**：密码
   - **用户名**：bloguser
   - **密码**：yourpassword
   - **数据库**：blog
3. 点击 "测试连接"，确认连接成功
4. 点击 "确定" 保存连接

### 2.3 （可选）使用命令行创建数据库和用户

如果没有 Navicat，也可以使用命令行创建：

```bash
# 进入 MongoDB 命令行
mongo

# 创建数据库
use blog

# 创建用户
 db.createUser({
   user: "bloguser",
   pwd: "yourpassword",
   roles: [
     { role: "readWrite", db: "blog" }
   ]
 })

# 退出
exit
```

## 3. 部署后端服务

### 3.1 上传代码

使用 Git 克隆代码或通过 SCP 上传：

```bash
# 克隆代码
git clone https://your-repo-url.git /var/www/blog

# 或通过 SCP 上传
scp -r local/path/to/blog-backend user@server:/var/www/blog/backend
```

### 3.2 安装依赖

```bash
cd /var/www/blog/backend
npm install
```

### 3.3 创建环境变量文件

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接字符串
MONGODB_URI=mongodb://bloguser:yourpassword@localhost:27017/blog

# JWT 密钥
JWT_SECRET=your-secret-key

# 服务器端口
PORT=5000
```

### 3.4 启动后端服务

使用 PM2 管理进程：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm start

# 或使用 PM2 启动
pm run dev

# 查看状态
pm ls
```

## 4. 部署前端项目

### 4.1 构建前端项目

在本地执行：

```bash
cd /path/to/blog
npm install
npm run build
```

### 4.2 上传构建文件

```bash
scp -r build/* user@server:/var/www/blog/frontend
```

## 5. Nginx 配置

### 5.1 创建 Nginx 配置文件

```bash
nano /etc/nginx/sites-available/blog
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/blog/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 启用配置

```bash
ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
nginx -t
nginx -s reload
```

## 6. 域名解析

### 6.1 购买域名

在域名注册商处购买域名，推荐：
- **阿里云域名**：https://wanwang.aliyun.com/
- **腾讯云域名**：https://dnspod.cloud.tencent.com/
- **GoDaddy**：https://www.godaddy.com/

### 6.2 配置 DNS

在域名管理控制台添加 A 记录，指向服务器的公网 IP 地址：

| 主机记录 | 记录类型 | 线路类型 | 记录值 | TTL |
|---------|---------|---------|-------|-----|
| @       | A       | 默认     | 服务器IP | 10分钟 |
| www     | A       | 默认     | 服务器IP | 10分钟 |

## 7. SSL 证书设置

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

按照提示完成证书申请和配置。

## 8. 初始化管理员账户

访问 `http://your-domain.com/api/auth/register` 注册管理员账户：

```bash
curl -X POST http://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-admin-password"}'
```

## 9. 测试访问

1. 前台访问：`https://your-domain.com`
2. 后台登录：`https://your-domain.com` 点击"登录后台"
3. API 健康检查：`https://your-domain.com/api/health`

## 10. 维护和监控

### 10.1 查看日志

```bash
# 后端日志
pm logs

# Nginx 日志
cat /var/log/nginx/access.log
cat /var/log/nginx/error.log
```

### 10.2 自动更新 SSL 证书

Let's Encrypt 证书有效期为 90 天，设置自动更新：

```bash
crontab -e
```

添加以下内容：

```
0 0 1 * * certbot renew --quiet
```

### 10.3 定期备份

创建备份脚本：

```bash
nano /root/backup.sh
```

添加以下内容：

```bash
#!/bin/bash

# 备份目录
BACKUP_DIR="/root/backups"
DATE=$(date +"%Y%m%d")

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mongodump --db blog --out $BACKUP_DIR/blog-$DATE

# 备份代码
zip -r $BACKUP_DIR/code-$DATE.zip /var/www/blog

# 保留最近 7 天的备份
find $BACKUP_DIR -type f -mtime +7 -delete
```

设置定时执行：

```bash
chmod +x /root/backup.sh
crontab -e
```

添加：

```
0 2 * * * /root/backup.sh
```

## 11. 常见问题排查

### 11.1 502 Bad Gateway

- 检查后端服务是否运行：`npm status`
- 检查端口是否开放：`netstat -tuln | grep 5000`
- 检查防火墙设置：`ufw status`

### 11.2 数据库连接失败

- 检查 MongoDB 服务状态：`systemctl status mongodb`
- 检查数据库连接字符串是否正确
- 检查用户权限是否正确

### 11.3 前端无法访问 API

- 检查 Nginx 配置是否正确
- 检查 CORS 设置是否允许跨域
- 检查后端服务是否正常运行

## 12. 性能优化

### 12.1 前端优化

- 启用 gzip 压缩：在 Nginx 配置中添加
- 配置浏览器缓存
- 优化图片大小和格式
- 使用 CDN 加速静态资源

### 12.2 后端优化

- 启用 MongoDB 索引
- 优化 API 响应时间
- 使用缓存减少数据库查询
- 配置适当的进程数量

## 13. 安全设置

### 13.1 服务器安全

- 启用防火墙：`ufw enable`
- 只开放必要的端口：`ufw allow 80/tcp`, `ufw allow 443/tcp`, `ufw allow 22/tcp`
- 禁用 root 远程登录
- 使用 SSH 密钥登录

### 13.2 应用安全

- 定期更新依赖包：`npm update`
- 使用 HTTPS 加密传输
- 实现 rate limiting 防止暴力攻击
- 对用户输入进行验证和 sanitization

---

部署完成后，你的博客网站就可以通过域名访问了，具备完整的文章管理、评论功能和后台管理系统。