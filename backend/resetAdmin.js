const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ MongoDB 连接成功');

    // 删除现有账号
    await User.deleteOne({ username: 'ShaoGuang' });
    console.log('✓ 已删除旧管理员账号');

    // 创建新账号
    const newAdmin = await User.create({
      username: 'ShaoGuang',
      password: 'Ljh20050408',
      email: 'admin@shaoguang.com',
      phone: '18709297251',
      role: 'admin'
    });
    console.log('✓ 已创建新管理员账号');

    // 验证密码
    const isMatch = await newAdmin.comparePassword('Ljh20050408');
    console.log(`✓ 密码验证: ${isMatch ? '成功 ✓' : '失败 ✗'}`);

    console.log('\n管理员凭据:');
    console.log('  用户名: ShaoGuang');
    console.log('  密  码: Ljh20050408');
    console.log('  手机号: 18709297251');

    await mongoose.disconnect();
    console.log('\n✓ 完成');
    process.exit(0);
  } catch (err) {
    console.error('✗ 错误:', err.message);
    process.exit(1);
  }
}

resetAdmin();
