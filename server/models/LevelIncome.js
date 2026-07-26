const mongoose = require('mongoose');

const levelIncomeSchema = new mongoose.Schema({
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
levelIncomeSchema.index({ receiver: 1, date: -1 });
levelIncomeSchema.index({ generator: 1 });
levelIncomeSchema.index({ investment: 1 });

module.exports = mongoose.model('LevelIncome', levelIncomeSchema);
