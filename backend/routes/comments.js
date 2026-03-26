const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const jwt = require('jsonwebtoken');

// 验证token中间件
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: '未授权' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '无效的token' });
  }
};

// 验证邮箱格式
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 获取文章的评论列表（只显示已审核的）
router.get('/post/:postId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const comments = await Comment.find({ 
      postId: req.params.postId,
      status: 'approved'
    })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    const total = await Comment.countDocuments({ 
      postId: req.params.postId,
      status: 'approved'
    });
    
    res.json({ comments, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建评论
router.post('/', async (req, res) => {
  try {
    const { nickname, email, content, postId } = req.body;
    
    // 验证必填字段
    if (!nickname || !email || !content || !postId) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }
    
    // 验证邮箱格式
    if (!validateEmail(email)) {
      return res.status(400).json({ message: '请输入有效的邮箱地址' });
    }
    
    // 验证评论内容长度
    if (content.length > 2000) {
      return res.status(400).json({ message: '评论内容不能超过2000字' });
    }
    
    const comment = new Comment({
      nickname,
      email,
      content,
      postId,
      status: 'pending'
    });
    
    await comment.save();
    
    res.status(201).json({ 
      message: '评论提交成功，等待审核后显示',
      comment: {
        _id: comment._id,
        nickname: comment.nickname,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除评论
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞评论
router.post('/:id/like', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    comment.likeCount++;
    await comment.save();
    
    res.json({ likeCount: comment.likeCount });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有评论（管理员）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const comments = await Comment.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    const total = await Comment.countDocuments(query);
    
    res.json({ comments, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 审核评论
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '无效的状态' });
    }
    
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    res.json({ 
      message: status === 'approved' ? '评论已通过审核' : '评论已拒绝',
      comment 
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
