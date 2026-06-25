const express = require('express');
const router = express.Router();
const FriendLink = require('../models/FriendLink');
const { auth, adminOnly } = require('../middleware/auth');
const { generateCaptcha, verifyCaptcha } = require('../utils/captcha');

const URL_OK = (u) => /^https?:\/\//i.test(u);

// 公开：只返回已通过的友链（老数据无 status 字段也按已通过显示）
router.get('/', async (req, res) => {
  try {
    const links = await FriendLink.find({ status: { $nin: ['pending', 'rejected'] } }).sort({ createdAt: -1 });
    res.json({ links });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 公开：获取申请表单用的验证码
router.get('/captcha', (req, res) => {
  const { svg, sessionId } = generateCaptcha();
  res.json({ svg, sessionId });
});

// 公开：陌生人申请友链（带验证码，存为待审核）
router.post('/apply', async (req, res) => {
  try {
    const { name, avatar, description, sessionId, captcha } = req.body;
    let { url } = req.body;
    if (!name || !url) return res.status(400).json({ message: '名称和链接必填' });
    if (!sessionId || !captcha) return res.status(400).json({ message: '请填写验证码' });
    const result = verifyCaptcha(sessionId, captcha);
    if (!result.ok) return res.status(400).json({ message: result.reason === 'expired' ? '验证码已过期，请重新获取' : '验证码错误' });
    if (!URL_OK(url)) url = 'https://' + url;
    await FriendLink.create({ name, avatar: avatar || '', url, description: description || '', status: 'pending' });
    res.status(201).json({ message: '申请已提交，等待站长审核' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员：返回全部友链（含待审核）
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const links = await FriendLink.find().sort({ createdAt: -1 });
    res.json({ links });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, avatar, description } = req.body;
    let { url } = req.body;
    if (!name || !url) return res.status(400).json({ message: '名称和链接必填' });
    if (!URL_OK(url)) url = 'https://' + url;
    const link = await FriendLink.create({ name, avatar, url, description, status: 'approved' });
    res.status(201).json(link);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, avatar, description } = req.body;
    let { url } = req.body;
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    const link = await FriendLink.findByIdAndUpdate(req.params.id, { name, avatar, url, description }, { new: true });
    if (!link) return res.status(404).json({ message: '友链不存在' });
    res.json(link);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员：审核友链（通过/拒绝）
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ message: '状态不合法' });
    const link = await FriendLink.findByIdAndUpdate(req.params.id, { status }, { new: true });
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
