const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

async function initCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('\n=== 📁 初始化分类 ===\n');

    // 检查是否已有分类
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log('✅ 分类已存在，无需初始化');
      const categories = await Category.find();
      categories.forEach(c => console.log(`   • ${c.name}`));
    } else {
      // 创建默认分类
      const defaultCategories = [
        { name: '技术分享', description: '关于编程和技术的文章' },
        { name: '生活感悟', description: '生活中的思考和感悟' },
        { name: '项目总结', description: '项目经验和总结' },
        { name: '学习笔记', description: '学习过程中的笔记' },
        { name: '前端开发', description: 'React、Vue等前端技术' },
        { name: '后端开发', description: 'Node.js、Python等后端技术' }
      ];

      await Category.insertMany(defaultCategories);
      console.log('✅ 已创建 6 个默认分类：');
      defaultCategories.forEach(c => console.log(`   • ${c.name} - ${c.description}`));
    }

    console.log('\n✅ 初始化完成\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}

initCategories();
