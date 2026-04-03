const mongoose = require('mongoose');
const Comment = require('./models/Comment');
const Post = require('./models/Post');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('数据库连接成功');

  // 获取所有文章
  const posts = await Post.find();
  if (posts.length === 0) {
    console.log('没有文章，无法导入评论');
    mongoose.disconnect();
    return;
  }

  const comments = [
    {
      postId: posts[0]._id,
      nickname: '小明',
      email: 'xiaoming@example.com',
      content: '写得很好，很有帮助！',
      likeCount: 5,
      status: 'approved',
      createdAt: new Date('2024-01-02')
    },
    {
      postId: posts[0]._id,
      nickname: '小红',
      email: 'xiaohong@example.com',
      content: '谢谢分享，学到了很多。',
      likeCount: 3,
      status: 'approved',
      createdAt: new Date('2024-01-03')
    },
    {
      postId: posts.length > 1 ? posts[1]._id : posts[0]._id,
      nickname: '游客',
      email: 'visitor@example.com',
      content: '内容很实用，支持！',
      likeCount: 2,
      status: 'approved',
      createdAt: new Date('2024-01-04')
    }
  ];

  // 检查并插入评论
  let imported = 0;
  for (const comment of comments) {
    const existing = await Comment.findOne({
      postId: comment.postId,
      content: comment.content
    });
    if (!existing) {
      await Comment.create(comment);
      imported++;
    }
  }

  console.log(`成功导入 ${imported} 条评论数据`);
  mongoose.disconnect();
}).catch(err => {
  console.error('数据库连接错误:', err);
});