const express = require('express');
const router = express.Router();
const Stats = require('../models/Stats');
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

// 记录访问统计
router.post('/record', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let stats = await Stats.findOne({ date: today });
    if (!stats) {
      stats = new Stats({ date: today });
    }
    
    // 更新统计数据
    stats.pageViews++;
    if (req.body.isUnique) {
      stats.uniqueVisitors++;
    }
    if (req.body.isPostView) {
      stats.postViews++;
    }
    if (req.body.isComment) {
      stats.commentCount++;
    }
    
    await stats.save();
    res.json({ message: '统计成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取统计数据（管理员）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await Stats.find({ date: { $gte: startDate, $lte: endDate } })
      .sort({ date: 1 });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取总统计数据（管理员）
router.get('/total', authMiddleware, async (req, res) => {
  try {
    const totalStats = await Stats.aggregate([
      {
        $group: {
          _id: null,
          totalPageViews: { $sum: '$pageViews' },
          totalUniqueVisitors: { $sum: '$uniqueVisitors' },
          totalPostViews: { $sum: '$postViews' },
          totalComments: { $sum: '$commentCount' }
        }
      }
    ]);
    
    res.json(totalStats[0] || {
      totalPageViews: 0,
      totalUniqueVisitors: 0,
      totalPostViews: 0,
      totalComments: 0
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;