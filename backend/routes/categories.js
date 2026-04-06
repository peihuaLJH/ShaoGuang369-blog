const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Post = require('../models/Post');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    // 计算每个分类的文章数
    for (let cat of categories) {
      cat.postCount = await Post.countDocuments({ category: cat.name, type: 'blog', status: 'published' });
    }
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: '分类名不能为空' });
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: '分类已存在' });
    const category = await Category.create({ name: name.trim(), description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { name, description }, { new: true });
    if (!category) return res.status(404).json({ message: '分类不存在' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: '分类不存在' });
    res.json({ message: '分类已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
