const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ MongoDB 连接成功');

    const admin = await User.findOne({ username: 'ShaoGuang' });
    if (!admin) {
      const newAdmin = await User.create({
        username: 'ShaoGuang',
        password: 'Ljh20050408',
        email: 'admin@shaoguang.com',
        phone: '18709297251',
        role: 'admin'
      });
      console.log('✓ 管理员账号已创建！');
      console.log('  用户名: ShaoGuang');
      console.log('  密  码: Ljh20050408');
      console.log('  手机号: 18709297251');
    } else {
      console.log('✓ 管理员账号已存在');
      console.log('  用户名:', admin.username);
      console.log('  手机号:', admin.phone);
      
      // 确保手机号正确
      if (admin.phone !== '18709297251') {
        await User.findOneAndUpdate({ username: 'ShaoGuang' }, { phone: '18709297251' });
        console.log('✓ 手机号已更新为: 18709297251');
      }
    }

    await mongoose.disconnect();
    console.log('✓ 初始化完成');
    process.exit(0);
  } catch (err) {
    console.error('✗ 错误:', err.message);
    process.exit(1);
  }
}

initAdmin();
