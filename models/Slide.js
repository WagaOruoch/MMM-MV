const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['cover', 'photo', 'stat', 'quote', 'message', 'closing'],
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  backgroundColor: {
    type: String,
    default: 'gradient-1'
  },
  order: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  // For stat slides
  stats: [{
    label: String,
    value: String
  }]
}, {
  timestamps: true
});

// Index for efficient ordering queries
slideSchema.index({ order: 1 });
slideSchema.index({ isPublished: 1, order: 1 });

module.exports = mongoose.model('Slide', slideSchema);
