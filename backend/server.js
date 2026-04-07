const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS 配置：生产环境只允许自己的域名，开发环境允许 localhost
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://shaoguang369.top', 'https://www.shaoguang369.top']
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 curl、服务器内部请求）
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 - 上传的文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const User = require('./models/User');

// 初始化管理员账号
async function initializeAdmin() {
  try {
    const admin = await User.findOne({ username: 'ShaoGuang' });
    if (!admin) {
      const newAdmin = await User.create({
        username: 'ShaoGuang',
        password: 'Ljh20050408',
        email: 'admin@shaoguang.com',
        phone: '18709297251',
        role: 'admin'
      });
      console.log('✓ 管理员账号已创建：username=ShaoGuang, password=Ljh20050408, phone=18709297251');
    } else {
      // 如果账号存在但没有手机号，则更新手机号
      if (!admin.phone || admin.phone !== '18709297251') {
        await User.findOneAndUpdate({ username: 'ShaoGuang' }, { phone: '18709297251' });
        console.log('✓ 管理员手机号已更新：18709297251');
      }
    }
  } catch (err) {
    console.error('⚠ 初始化管理员失败:', err.message);
  }
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB 连接成功');
  initializeAdmin();
})
.catch(err => console.error('MongoDB 连接错误:', err));

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const categoryRoutes = require('./routes/categories');
const messageRoutes = require('./routes/messages');
const friendlinkRoutes = require('./routes/friendlinks');
const settingsRoutes = require('./routes/settings');
const visitorRoutes = require('./routes/visitors');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friendlinks', friendlinkRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 生产模式：Nginx 负责提供前端静态文件，后端仅作 API 服务
// 保留此段作为兜底（直接访问 5000 端口时）
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));
  // API 路由已在上方注册，所有非 API 路径返回前端 index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
