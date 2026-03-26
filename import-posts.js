const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('数据库连接成功');
  
  // 导入Post模型
  const Post = require('./backend/models/Post');
  
  // 读取文章目录
  const postsDir = path.join(__dirname, 'source/_posts');
  const files = fs.readdirSync(postsDir);
  
  console.log(`发现 ${files.length} 篇文章`);
  
  // 导入每篇文章
  for (const file of files) {
    if (file.endsWith('.md')) {
      try {
        const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
        
        // 解析front matter
        const frontMatterMatch = content.match(/^---[\s\S]*?---/);
        if (frontMatterMatch) {
          const frontMatter = frontMatterMatch[0];
          const body = content.replace(frontMatter, '').trim();
          
          // 解析front matter内容
          const frontMatterLines = frontMatter.split('\n').filter(line => line.trim() && !line.startsWith('---'));
          const postData = {
            title: '',
            content: body,
            summary: body.substring(0, 200),
            viewCount: 0,
            likeCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          for (const line of frontMatterLines) {
            const [key, ...value] = line.split(':').map(item => item.trim());
            const val = value.join(':').trim();
            
            if (key === 'title') {
              postData.title = val.replace(/['"]/g, '');
            } else if (key === 'date') {
              postData.createdAt = new Date(val);
            } else if (key === 'categories') {
              postData.categories = val.replace(/['\[\]]/g, '').split(',').map(item => item.trim());
            } else if (key === 'tags') {
              postData.tags = val.replace(/['\[\]]/g, '').split(',').map(item => item.trim());
            }
          }
          
          // 检查文章是否已存在
          const existingPost = await Post.findOne({ title: postData.title });
          if (!existingPost) {
            await Post.create(postData);
            console.log(`导入成功: ${postData.title}`);
          } else {
            console.log(`文章已存在: ${postData.title}`);
          }
        }
      } catch (error) {
        console.error(`导入文章 ${file} 失败:`, error.message);
      }
    }
  }
  
  console.log('文章导入完成');
  mongoose.disconnect();
}).catch(err => {
  console.error('数据库连接错误:', err);
});