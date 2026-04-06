const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  ip: { type: String, default: '' },
  province: { type: String, default: '未知' },
  device: { type: String, default: 'desktop', enum: ['desktop', 'mobile', 'tablet', 'android', 'ios'] },
  browser: { type: String, default: '' },
  page: { type: String, default: '/' },
  visitedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visitor', VisitorSchema);
