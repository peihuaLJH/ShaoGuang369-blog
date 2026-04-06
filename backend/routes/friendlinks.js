const express = require('express');
const router = express.Router();
const FriendLink = require('../models/FriendLink');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const links = await FriendLink.find().sort({ createdAt: -1 });
    res.json({ links });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, avatar, url, description } = req.body;
    if (!name || !url) return res.status(400).json({ message: '名称和链接必填' });
    const link = await FriendLink.create({ name, avatar, url, description });
    res.status(201).json(link);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, avatar, url, description } = req.body;
    const link = await FriendLink.findByIdAndUpdate(req.params.id, { name, avatar, url, description }, { new: true });
    if (!link) return res.status(404).json({ message: '友链不存在' });
    res.json(link);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await FriendLink.findByIdAndDelete(req.params.id);
    res.json({ message: '友链已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
