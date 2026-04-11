const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');
const Subscriber = require('../models/Subscriber');

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
    res.json({ message: '订阅成功！感谢您的关注！' });
  } catch (err) {
    console.error('订阅失败:', err);
    res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});

module.exports = router;
