const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
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
const subscribeRoutes = require('./routes/subscribe');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friendlinks', friendlinkRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/subscribe', subscribeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
