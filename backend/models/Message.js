const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  email: { type: String, required: true },
  content: { type: String, required: true },
  website: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
