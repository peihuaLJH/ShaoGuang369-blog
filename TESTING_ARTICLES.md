# 📝 文章与随笔测试指南

## ✅ 系统状态检查

在测试前，请确保：

1. **后端服务运行**：
   ```bash
   npm run server
   # 应该看到: Server running on port 5000
   ```

2. **前端运行**：
   ```bash
   npm start
   # 应该自动打开 http://localhost:3000
   ```

3. **数据库连接**：
   - 运行后端时会自动连接 MongoDB
   - 日志应显示: "MongoDB connected"

---

## 🚀 测试步骤

### 步骤 1: 登录管理后台

1. 打开 http://localhost:3000
2. 点击右上角 **"管理"** 按钮
3. 使用以下凭证登录（首次需创建）：
   - **用户名**: admin
   - **密码**: password123

### 步骤 2: 创建文章

1. 在管理面板中选择 **"创建文章"**
2. 填写以下信息：

   | 字段 | 示例值 |
   |------|--------|
   | **标题** | 我的第一篇技术文章 |
   | **摘要** | 这是一篇关于React的详细指南 |
   | **分类** | 前端开发 |
   | **标签** | React, JavaScript, 教程 |
   | **内容** | （参考下方示例） |

3. **Markdown 编辑器示例**：
   ```markdown
   # React 基础教程

   ## 什么是 React？

   React 是一个用于构建用户界面的 JavaScript 库。

   ### 核心概念

   - **组件（Components）**: UI 的可复用单位
   - **状态（State）**: 组件内部数据
   - **属性（Props）**: 组件间的通信

   ## 代码示例

   \`\`\`jsx
   import React, { useState } from 'react';

   function Counter() {
     const [count, setCount] = useState(0);

     return (
       <div>
         <p>Count: {count}</p>
         <button onClick={() => setCount(count + 1)}>
           增加
         </button>
       </div>
     );
   }
   \`\`\`

   ## 总结

   React 使得构建复杂 UI 变得更加简单！
   ```

4. 点击 **"发布"** 或 **"保存为草稿"**

### 步骤 3: 创建随笔

1. 选择 **"创建随笔"**（如果有此选项）
2. 填写信息（随笔通常格式更自由）：

   | 字段 | 示例值 |
   |------|--------|
   | **标题** | 今天的思考 |
   | **内容** | 自由形式的文字 |

3. 发布

### 步骤 4: 测试编辑功能

1. 在文章/随笔列表中找到刚创建的内容
2. 点击 **"编辑"** 按钮
3. 修改以下内容：
   - 更改标题
   - 修改正文内容
   - 更新标签
4. 点击 **"保存"** 或 **"更新"**
5. 验证更改是否显示

### 步骤 5: 测试删除功能

1. 创建一篇临时文章用于测试
2. 点击 **"删除"** 按钮
3. 确认删除对话框
4. 验证文章已从列表中移除

---

## 🧪 功能检查清单

查看每个功能是否正常工作：

### 文章创建
- [ ] 能打开编辑界面
- [ ] Markdown 编辑器正常显示
- [ ] 可输入标题、摘要、内容
- [ ] 分类和标签可正确选择
- [ ] 发布后文章出现在列表中

### 文章编辑
- [ ] 编辑界面正确加载文章内容
- [ ] 可修改所有字段
- [ ] 空白 catch 块不导致错误
- [ ] 保存后更改生效

### 文章删除
- [ ] 删除按钮可点击
- [ ] 出现确认对话框
- [ ] 确认后文章移除

### Markdown 支持
- [ ] 标题（# 到 ######）
- [ ] 列表（有序和无序）
- [ ] 代码块（```）
- [ ] 链接和图片
- [ ] 粗体和斜体

---

## 🐛 常见问题排查

### 问题 1: 登录失败
**原因**：管理员账户未创建
**解决**：
```bash
node backend/createAdmin.js
# 按提示输入用户名和密码
```

### 问题 2: 单击"编辑"时出现错误
**原因**：AdminPanel.js 中的 catch 块问题
**状态**：✅ 已修复（4处空 catch 块）

### 问题 3: 保存时数据未更新
**可能原因**：
- 后端服务未运行
- 数据库连接断开
- API 端点不正确

**检查**：
```bash
curl http://localhost:5000/api/posts
# 应该返回 JSON 数组
```

### 问题 4: Markdown 不正确渲染
**原因**：渲染库问题
**检查**：打开浏览器开发者工具，查看控制台错误

---

## 📊 API 端点测试

可用的 API 端点（需要认证 token）：

```bash
# 获取所有文章
curl http://localhost:5000/api/posts

# 获取单篇文章
curl http://localhost:5000/api/posts/:id

# 创建文章（POST）
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Article",
    "content": "# Test",
    "category": "Tech",
    "tags": ["test"]
  }'

# 更新文章（PUT）
curl -X PUT http://localhost:5000/api/posts/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Updated Title"}'

# 删除文章（DELETE）
curl -X DELETE http://localhost:5000/api/posts/:id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💾 数据库验证

使用 MongoDB 客户端检查数据：

```javascript
// 连接到 MongoDB
use blog

// 查看所有集合
show collections

// 查询所有文章
db.posts.find()

// 查询特定文章
db.posts.findOne({ title: "我的第一篇技术文章" })

// 查看所有用户
db.users.find()
```

---

## ✅ 测试完成标记

完成以下所有项后，系统就已准备好生产使用：

- [ ] 成功登录管理后台
- [ ] 创建了至少 2 篇文章
- [ ] 创建了至少 1 篇随笔
- [ ] 编辑功能正常工作
- [ ] 删除功能正常工作
- [ ] Markdown 正确渲染
- [ ] 没有控制台错误
- [ ] 没有 15xx 错误日志

---

## 📝 记录问题

如在测试过程中发现任何问题，请记录：

```
问题描述：
　______________________________________

重现步骤：
　1. ______________________________________
　2. ______________________________________
　3. ______________________________________

预期结果：
　______________________________________

实际结果：
　______________________________________

错误日志：
　______________________________________
```

---

**祝测试愉快！** 🎉
