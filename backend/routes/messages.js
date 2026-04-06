const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth, adminOnly } = require('../middleware/auth');

// 获取已审核通过的留言（公开）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const messages = await Message.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Message.countDocuments({ status: 'approved' });
    res.json({ messages, total });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有留言（管理员）
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== 'all' ? { status } : {};
    const messages = await Message.find(query).sort({ createdAt: -1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 提交留言
router.post('/', async (req, res) => {
  try {
    const { nickname, email, content, website } = req.body;
    if (!nickname || !nickname.trim()) return res.status(400).json({ message: '请输入昵称' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: '请输入有效邮箱' });
    if (!content || !content.trim()) return res.status(400).json({ message: '请输入留言内容' });
    const message = await Message.create({
      nickname: nickname.trim(),
      email: email.trim(),
      content: content.trim(),
      website: website ? website.trim() : ''
    });
    res.status(201).json({ message: '留言已提交，等待审核' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 审核留言
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!message) return res.status(404).json({ message: '留言不存在' });
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除留言
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: '留言已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
