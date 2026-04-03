const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  // 延迟初始化以确保连接稳定
  setTimeout(() => {
    require('./routes/posts'); // 这会触发initTestPosts
  }, 2000);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  // 如果连接失败，使用内存存储作为 fallback
  console.log('Using in-memory storage as fallback');
  const memoryStore = {
    users: [
      {
        _id: '1',
        username: 'ShaoGuang',
        password: 'Ljh20050408',
        role: 'admin'
      }
    ],
    posts: [
      {
        _id: '1',
        title: '欢迎来到我的博客',
        content: '这是我的第一篇博客文章，记录我的学习和生活。\n\n希望通过这个博客分享我的知识和经验，与大家共同成长。',
        summary: '欢迎来到我的博客，记录学习和生活',
        tags: ['生活', '学习'],
        viewCount: 100,
        likeCount: 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: '2',
        title: '学习React的心得',
        content: 'React是一个非常强大的前端框架，通过组件化的方式让开发变得更加高效。\n\n我在学习过程中遇到了很多挑战，但通过不断实践，逐渐掌握了React的核心概念。',
        summary: '分享学习React的心得体会',
        tags: ['前端', 'React'],
        viewCount: 80,
        likeCount: 8,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ],
    comments: [
      {
        _id: '1',
        postId: '1',
        nickname: '访客',
        email: 'guest@example.com',
        content: '非常好的博客！',
        likeCount: 2,
        status: 'approved',
        createdAt: new Date('2024-01-01')
      }
    ],
    stats: {
      totalVisits: 1000,
      uniqueVisitors: 500,
      postViews: 800
    }
  };
  app.set('memoryStore', memoryStore);
});

// 导入路由
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const statsRoutes = require('./routes/stats');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
