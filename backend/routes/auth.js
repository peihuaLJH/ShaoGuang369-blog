const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 只允许 ShaoGuang 登录后台
    if (username !== 'ShaoGuang') {
      return res.status(401).json({ message: '该用户无权限访问后台' });
    }
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 验证密码（支持明文和加密密码）
    let isMatch = false;
    
    // 先尝试 bcrypt 比较（加密密码）
    if (user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // 明文密码直接比较
      isMatch = password === user.password;
    }
    
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 生成token
    const token = jwt.sign({ id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 注册（仅用于初始化管理员账户）
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = new User({ username, password: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;