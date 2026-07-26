const mongoose = require('mongoose');

const roiHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Credited', 'Pending', 'Failed'],
    default: 'Credited'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for idempotency - prevent duplicate ROI for same investment on same date
roiHistorySchema.index({ investment: 1, date: 1 }, { unique: true });
roiHistorySchema.index({ user: 1, date: -1 });
roiHistorySchema.index({ status: 1 });

module.exports = mongoose.model('ROIHistory', roiHistorySchema);
