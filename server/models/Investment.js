const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [100, 'Minimum investment amount is 100']
  },
  plan: {
    name: {
      type: String,
      required: true
    },
    durationDays: {
      type: Number,
      required: true
    },
    dailyROIPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  totalROIGenerated: {
    type: Number,
    default: 0
  },
  lastROIProcessedDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
investmentSchema.index({ user: 1, status: 1 });
investmentSchema.index({ status: 1, endDate: 1 });
investmentSchema.index({ lastROIProcessedDate: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
