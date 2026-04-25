const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { auth, adminOnly } = require('../middleware/auth');
const Subscriber = require('../models/Subscriber');
const { sendNewPostNotification } = require('../utils/emailService');

// 获取文章列表（公开）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type = 'blog', search } = req.query;
    const query = { status: 'published' };
    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }
    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Post.countDocuments(query);
    res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有文章（管理员）
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const posts = await Post.find(query).populate('author', 'username').sort({ createdAt: -1 });
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单篇文章
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    if (!post) return res.status(404).json({ message: '文章不存在' });
    post.viewCount += 1;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建文章
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, content, summary, coverImage, category, tags, type, status } = req.body;
    const post = new Post({
      title, content, summary, coverImage, category,
      tags: tags || [], type: type || 'blog', status: status || 'published',
      author: req.user._id
    });
    await post.save();
    // 发布状态时通知所有订阅者
    if (post.status === 'published') {
      const subscribers = await Subscriber.find();
      if (subscribers.length > 0) {
        sendNewPostNotification(subscribers, post);
      }
    }
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新文章
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, content, summary, coverImage, category, tags, type, status } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: '文章不存在' });
    Object.assign(post, { title, content, summary, coverImage, category, tags, type, status });
    post.updatedAt = Date.now();
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除文章
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: '文章不存在' });
    await post.deleteOne();
    await Comment.deleteMany({ post: req.params.id });
    res.json({ message: '文章已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞文章
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: '文章不存在' });
    post.likeCount += 1;
    await post.save();
    res.json({ likeCount: post.likeCount });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
