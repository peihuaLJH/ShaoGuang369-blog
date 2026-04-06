const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: '未授权' });
  }
};

router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ 
      post: req.params.postId,
      status: 'approved'
    }).sort({ createdAt: -1 });
    
    res.json({ comments });
  } catch (error) {
    console.error('获取评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { status, limit = 100 } = req.query;
    const query = {};
    if (status) query.status = status;
    
    const comments = await Comment.find(query)
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ comments });
  } catch (error) {
    console.error('获取评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { content, author, email, postId } = req.body;
    
    if (!email.includes('@')) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }
    
    const comment = new Comment({
      content,
      author,
      email,
      post: postId
    });
    
    await comment.save();
    res.status(201).json({ message: '评论已提交，等待审核', comment });
  } catch (error) {
    console.error('创建评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权操作' });
    }
    
    const { status } = req.body;
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('审核评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权操作' });
    }
    
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    res.json({ message: '评论已删除' });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    comment.likeCount += 1;
    await comment.save();
    
    res.json({ likeCount: comment.likeCount });
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
