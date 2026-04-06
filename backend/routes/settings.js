const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const { auth, adminOnly } = require('../middleware/auth');

// 获取网站设置（公开）
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新网站设置（管理员）
router.put('/', auth, adminOnly, async (req, res) => {
  try {
    const { avatar, quote, siteDescription, douyinUrl, email, icpNumber, createdSince } = req.body;
    let settings = await SiteSettings.getSettings();
    if (avatar !== undefined) settings.avatar = avatar;
    if (quote !== undefined) settings.quote = quote;
    if (siteDescription !== undefined) settings.siteDescription = siteDescription;
    if (douyinUrl !== undefined) settings.douyinUrl = douyinUrl;
    if (email !== undefined) settings.email = email;
    if (icpNumber !== undefined) settings.icpNumber = icpNumber;
    if (createdSince !== undefined) settings.createdSince = createdSince;
    settings.updatedAt = Date.now();
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
