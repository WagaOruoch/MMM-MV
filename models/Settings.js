const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  backgroundMusicUrl: {
    type: String,
    default: ''
  },
  backgroundMusicEnabled: {
    type: Boolean,
    default: false
  },
  siteTitle: {
    type: String,
    default: 'Our Monthversary'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
