const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
  avatar: { type: String, default: '' },
  quote: { type: String, default: '允许自己走慢点，但别停下' },
  siteDescription: { type: String, default: '韶光的个人博客 - 分享跨境电商学习日常与生活随笔' },
  douyinUrl: { type: String, default: '' },
  email: { type: String, default: '' },
  icpNumber: { type: String, default: '' },
  createdSince: { type: String, default: '2025' },
  updatedAt: { type: Date, default: Date.now }
});

SiteSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
