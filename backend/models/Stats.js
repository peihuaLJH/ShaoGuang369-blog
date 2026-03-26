const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  pageViews: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  postViews: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Stats', statsSchema);