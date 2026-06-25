const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');
const Subscriber = require('../models/Subscriber');
const { sendSubscriptionConfirmation } = require('../utils/emailService');
const { auth, adminOnly } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 内存存储验证码（生产环境可换 Redis）
const captchaStore = new Map();
const CAPTCHA_TTL = 5 * 60 * 1000; // 5分钟过期

// 定期清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of captchaStore) {
    if (now - entry.createdAt > CAPTCHA_TTL) {
      captchaStore.delete(id);
    }
  }
}, 60 * 1000);

// 生成简单唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// GET /captcha — 获取验证码
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: '#f0f0f0'
  });
  const sessionId = generateId();
  captchaStore.set(sessionId, {
    text: captcha.text.toLowerCase(),
    createdAt: Date.now()
  });
  res.json({ svg: captcha.data, sessionId });
});

// POST / — 订阅
router.post('/', async (req, res) => {
  const { email, sessionId, captcha } = req.body;

  if (!email || !sessionId || !captcha) {
    return res.status(400).json({ message: '缺少必要参数' });
  }

  // 校验验证码
  const entry = captchaStore.get(sessionId);
  if (!entry) {
    return res.status(400).json({ message: '验证码已过期，请重新获取' });
  }
  if (entry.text !== captcha.toLowerCase()) {
    captchaStore.delete(sessionId);
    return res.status(400).json({ message: '验证码错误' });
  }
  captchaStore.delete(sessionId);

  // 保存订阅
  try {
    const existing = await Subscriber.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.json({ message: '该邮箱已订阅，感谢您的关注！' });
    }
    await Subscriber.create({ email: email.trim().toLowerCase() });
    // 发送订阅成功确认邮件
    sendSubscriptionConfirmation(email.trim().toLowerCase());
    res.json({ message: '订阅成功！感谢您的关注！' });
  } catch (err) {
    console.error('订阅失败:', err);
    res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});

// ===== 管理员：订阅者增删改查 =====

// 列出所有订阅者
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json({ subscribers });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员手动添加订阅者（并发送订阅成功邮件）
router.post('/admin', auth, adminOnly, async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: '邮箱格式不正确' });
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.status(400).json({ message: '该邮箱已订阅' });
    const sub = await Subscriber.create({ email });
    sendSubscriptionConfirmation(email);
    res.status(201).json(sub);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改订阅者邮箱
router.put('/admin/:id', auth, adminOnly, async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: '邮箱格式不正确' });
    const dup = await Subscriber.findOne({ email, _id: { $ne: req.params.id } });
    if (dup) return res.status(400).json({ message: '该邮箱已存在' });
    const sub = await Subscriber.findByIdAndUpdate(req.params.id, { email }, { new: true });
    if (!sub) return res.status(404).json({ message: '订阅者不存在' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除订阅者
router.delete('/admin/:id', auth, adminOnly, async (req, res) => {
  try {
    const sub = await Subscriber.findByIdAndDelete(req.params.id);
    if (!sub) return res.status(404).json({ message: '订阅者不存在' });
    res.json({ message: '已删除' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
