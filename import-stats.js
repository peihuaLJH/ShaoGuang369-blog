const mongoose = require('mongoose');
const mongoose = require('./backend/models/Stats');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('数据库连接成功');

  // 生成过去30天的统计数据
  const stats = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // 检查是否已存在
    const existing = await Stats.findOne({ date });
    if (!existing) {
      const stat = new Stats({
        date,
        pageViews: Math.floor(Math.random() * 100) + 50, // 50-150随机
        uniqueVisitors: Math.floor(Math.random() * 50) + 20, // 20-70随机
        postViews: Math.floor(Math.random() * 80) + 30, // 30-110随机
        commentCount: Math.floor(Math.random() * 10) + 1 // 1-11随机
      });

      stats.push(stat);
    }
  }

  // 批量插入
  if (stats.length > 0) {
    await Stats.insertMany(stats);
    console.log(`成功导入 ${stats.length} 条统计数据`);
  } else {
    console.log('所有日期的统计数据已存在');
  }

  mongoose.disconnect();
}).catch(err => {
  console.error('数据库连接错误:', err);
});