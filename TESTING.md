# 功能测试计划

## 1. 测试环境准备

### 1.1 本地开发环境

- **后端服务**：运行在 http://localhost:5000
- **前端服务**：运行在 http://localhost:3000
- **数据库**：MongoDB 运行在 localhost:27017
- **数据库管理**：使用 Navicat 连接本地 MongoDB（端口 27017）

### 1.2 生产环境

- **网站地址**：https://your-domain.com
- **API地址**：https://your-domain.com/api

## 2. 测试步骤

### 2.1 后端API测试

#### 2.1.1 健康检查

```bash
curl -X GET http://localhost:5000/api/health
# 预期响应：{"status":"ok"}
```

#### 2.1.2 认证测试

**注册管理员账户**：

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
# 预期响应：{"message":"注册成功"}
```

**登录测试**：

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
# 预期响应：包含 token 和用户信息
```

#### 2.1.3 文章管理测试

**创建文章**：

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "测试文章",
    "content": "这是一篇测试文章",
    "summary": "测试文章摘要",
    "categories": ["测试"],
    "tags": ["测试", "示例"]
  }'
# 预期响应：创建的文章对象
```

**获取文章列表**：

```bash
curl -X GET http://localhost:5000/api/posts
# 预期响应：文章列表
```

**获取单篇文章**：

```bash
curl -X GET http://localhost:5000/api/posts/POST_ID
# 预期响应：文章详情
```

**更新文章**：

```bash
curl -X PUT http://localhost:5000/api/posts/POST_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "更新后的测试文章"}'
# 预期响应：更新后的文章对象
```

**删除文章**：

```bash
curl -X DELETE http://localhost:5000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
# 预期响应：{"message":"删除成功"}
```

#### 2.1.4 评论测试

**创建评论**：

```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "POST_ID",
    "nickname": "测试用户",
    "content": "这是一条测试评论"
  }'
# 预期响应：创建的评论对象
```

**获取文章评论**：

```bash
curl -X GET http://localhost:5000/api/comments/post/POST_ID
# 预期响应：评论列表
```

**删除评论**：

```bash
curl -X DELETE http://localhost:5000/api/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
# 预期响应：{"message":"删除成功"}
```

#### 2.1.5 统计测试

**记录访问**：

```bash
curl -X POST http://localhost:5000/api/stats/record \
  -H "Content-Type: application/json" \
  -d '{
    "isUnique": true,
    "isPostView": true
  }'
# 预期响应：{"message":"统计成功"}
```

**获取统计数据**：

```bash
curl -X GET http://localhost:5000/api/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
# 预期响应：统计数据列表
```

### 2.2 前端功能测试

#### 2.2.1 前台测试

1. **首页访问**：
   - 打开 http://localhost:3000
   - 验证文章列表是否显示
   - 验证文章卡片是否正常

2. **文章详情**：
   - 点击文章卡片进入详情页
   - 验证文章内容是否显示
   - 验证评论区是否显示
   - 验证点赞功能是否正常

3. **评论功能**：
   - 输入昵称和评论内容
   - 点击"发表评论"
   - 验证评论是否显示在列表中

4. **点赞功能**：
   - 点击文章的点赞按钮
   - 验证点赞数是否增加
   - 点击评论的点赞按钮
   - 验证评论点赞数是否增加

#### 2.2.2 后台测试

1. **登录**：
   - 点击"登录后台"
   - 输入用户名和密码
   - 验证是否成功进入后台

2. **文章管理**：
   - 点击"文章管理"标签
   - 验证文章列表是否显示
   - 测试创建新文章
   - 测试编辑文章
   - 测试删除文章

3. **评论管理**：
   - 点击"评论管理"标签
   - 验证评论列表是否显示
   - 测试删除评论

4. **统计数据**：
   - 点击"统计数据"标签
   - 验证统计卡片是否显示
   - 验证近30天数据是否显示

5. **退出登录**：
   - 点击"退出登录"
   - 验证是否返回前台

## 3. 测试检查点

### 3.1 功能完整性

- [ ] 文章CRUD操作正常
- [ ] 评论功能正常
- [ ] 点赞功能正常
- [ ] 后台管理功能正常
- [ ] 统计功能正常
- [ ] 登录/登出功能正常

### 3.2 性能测试

- [ ] 页面加载速度 < 3秒
- [ ] API响应时间 < 500ms
- [ ] 数据库查询时间 < 100ms

### 3.3 安全性测试

- [ ] 未授权访问保护
- [ ] 输入验证
- [ ] 密码加密
- [ ] CORS设置
- [ ] XSS防护

### 3.4 兼容性测试

- [ ] Chrome 最新版
- [ ] Firefox 最新版
- [ ] Safari 最新版
- [ ] Edge 最新版
- [ ] 移动端浏览器

## 4. 测试结果记录

| 测试项 | 预期结果 | 实际结果 | 状态 | 备注 |
|-------|---------|---------|------|------|
| 后端API健康检查 | 正常响应 | | | |
| 管理员注册 | 成功 | | | |
| 管理员登录 | 成功获取token | | | |
| 创建文章 | 成功 | | | |
| 获取文章列表 | 正常显示 | | | |
| 文章详情 | 正常显示 | | | |
| 更新文章 | 成功 | | | |
| 删除文章 | 成功 | | | |
| 创建评论 | 成功 | | | |
| 获取评论列表 | 正常显示 | | | |
| 删除评论 | 成功 | | | |
| 记录访问统计 | 成功 | | | |
| 获取统计数据 | 正常显示 | | | |
| 前台首页 | 正常显示 | | | |
| 文章详情页 | 正常显示 | | | |
| 评论功能 | 正常 | | | |
| 点赞功能 | 正常 | | | |
| 后台登录 | 成功 | | | |
| 后台文章管理 | 正常 | | | |
| 后台评论管理 | 正常 | | | |
| 后台统计数据 | 正常显示 | | | |
| 退出登录 | 成功 | | | |

## 5. 问题排查

### 5.1 常见错误及解决方案

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| 401 Unauthorized | token 无效或过期 | 重新登录获取新token |
| 404 Not Found | 资源不存在 | 检查ID是否正确 |
| 500 Internal Server Error | 服务器内部错误 | 查看服务器日志 |
| 数据库连接失败 | MongoDB 未运行或连接字符串错误 | 检查 MongoDB 服务状态和连接字符串 |
| 前端无法访问API | CORS 配置错误 | 检查后端 CORS 配置 |
| 页面空白 | 前端构建错误 | 重新构建前端项目 |

### 5.2 日志查看

**后端日志**：
```bash
npm logs
```

**Nginx 日志**：
```bash
cat /var/log/nginx/access.log
cat /var/log/nginx/error.log
```

**MongoDB 日志**：
```bash
tail -f /var/log/mongodb/mongod.log
```

## 6. 性能优化测试

### 6.1 加载速度测试

使用 Chrome DevTools 分析：
1. 打开 Chrome 浏览器
2. 访问网站
3. 按 F12 打开 DevTools
4. 切换到 Network 标签
5. 刷新页面
6. 查看页面加载时间和资源大小

### 6.2 API响应测试

使用 Postman 或 curl 测试 API 响应时间：

```bash
time curl -X GET http://localhost:5000/api/posts
```

### 6.3 数据库性能测试

使用 MongoDB 自带的性能分析工具：

```bash
mongo
use blog
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

## 7. 测试完成标准

1. 所有功能测试通过
2. 性能测试满足要求
3. 安全性测试通过
4. 兼容性测试通过
5. 没有严重的错误或警告

---

测试完成后，你的博客网站就可以正式上线使用了。