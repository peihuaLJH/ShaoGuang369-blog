const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { auth, adminOnly } = require('../middleware/auth');

// 记录访客
router.post('/track', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    const { page } = req.body;
    // 设备识别（需在 mobile 之前先判断 Android/iOS；iPad 归类为 tablet）
    let device = 'desktop';
    if (/android/i.test(ua)) device = 'android';
    else if (/iphone|ipod/i.test(ua)) device = 'ios';
    else if (/ipad/i.test(ua)) device = 'tablet';
    else if (/mobile/i.test(ua)) device = 'mobile';
    else if (/tablet/i.test(ua)) device = 'tablet';
    // 浏览器识别（Edge/OPR 需在 Chrome 之前判断，因为 UA 中含 Chrome 字样）
    let browser = 'Other';
    if (/edg\//i.test(ua)) browser = 'Edge';
    else if (/opr\//i.test(ua)) browser = 'Opera';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';

    await Visitor.create({ ip: ip.split(',')[0].trim(), device, browser, page: page || '/' });
    res.json({ ok: true });
  } catch (error) {
    res.json({ ok: true });
  }
});

// 获取统计信息（公开）
router.get('/stats', async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const uniqueVisitors = (await Visitor.distinct('ip')).length;
    const blogCount = await Post.countDocuments({ type: 'blog', status: 'published' });
    const essayCount = await Post.countDocuments({ type: 'essay', status: 'published' });
    const posts = await Post.find({ status: 'published' });
    const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
    const totalComments = await Comment.countDocuments({ status: 'approved' });

    // 设备分布
    const deviceStats = await Visitor.aggregate([
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 浏览器分布
    const browserStats = await Visitor.aggregate([
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top 10 活跃 IP
    const topIPs = await Visitor.aggregate([
      { $group: { _id: '$ip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 近7天每日访客量
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const dailyTrend = await Visitor.aggregate([
      { $match: { visitedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%m-%d', date: '$visitedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // 省份分布
    const provinceStats = await Visitor.aggregate([
      { $group: { _id: '$province', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      totalVisitors,
      uniqueVisitors,
      blogCount,
      essayCount,
      totalViews,
      totalLikes,
      totalComments,
      deviceStats,
      browserStats,
      topIPs,
      dailyTrend,
      provinceStats
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
