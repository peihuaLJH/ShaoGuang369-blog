const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/login', async (req, res) => {
  try {
    const { username, password, phone } = req.body;
    const DEBUG = true;
    
    if (DEBUG) console.log(`[登录] 尝试登录: username=${username}, phone=${phone}`);
    
    const user = await User.findOne({ username });
    if (!user) {
      if (DEBUG) console.log(`[登录] 用户不存在: ${username}`);
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    if (DEBUG) console.log(`[登录] 用户已找到: ${username}, role=${user.role}`);
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (DEBUG) console.log(`[登录] 密码错误: ${username}`);
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    if (DEBUG) console.log(`[登录] 密码正确: ${username}`);

    // 管理员登录需要验证手机号
    if (user.role === 'admin') {
      if (DEBUG) console.log(`[登录] 检查手机号: 数据库=${user.phone}, 前端=${phone}`);
      if (!phone || user.phone !== phone) {
        if (DEBUG) console.log(`[登录] 手机号验证失败`);
        return res.status(401).json({ message: '手机号验证失败' });
      }
      if (DEBUG) console.log(`[登录] 手机号验证成功`);
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    if (DEBUG) console.log(`[登录] ✓ 登录成功: ${username}`);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    const user = new User({ username, password, email, role: 'user' });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
