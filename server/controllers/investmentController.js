const Investment = require('../models/Investment');
const User = require('../models/User');
const { distributeReferralIncome } = require('../services/referralService');
const { processDailyROI } = require('../services/roiService');

/**
 * Predefined investment plans
 */
const INVESTMENT_PLANS = [
  { name: 'Starter Plan',  durationDays: 30,  dailyROIPercentage: 1.0, minAmount: 100,   maxAmount: 4999  },
  { name: 'Silver Plan',   durationDays: 60,  dailyROIPercentage: 1.5, minAmount: 5000,  maxAmount: 19999 },
  { name: 'Gold Plan',     durationDays: 90,  dailyROIPercentage: 2.0, minAmount: 20000, maxAmount: 49999 },
  { name: 'Platinum Plan', durationDays: 180, dailyROIPercentage: 2.5, minAmount: 50000, maxAmount: null  }
];

/**
 * @desc    Get available investment plans
 * @route   GET /api/investments/plans
 * @access  Private
 */
exports.getPlans = (req, res) => {
  res.status(200).json({ success: true, data: INVESTMENT_PLANS });
};

/**
 * @desc    Manually trigger daily ROI (for testing)
 * @route   POST /api/investments/trigger-roi
 * @access  Private
 */
exports.triggerROI = async (req, res) => {
  try {
    const result = await processDailyROI();
    res.status(200).json({ success: true, message: 'ROI processing triggered', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create new investment
 * @route   POST /api/investments
 * @access  Private
 */
exports.createInvestment = async (req, res) => {
  try {
    const { amount, planName, durationDays, dailyROIPercentage } = req.body;

    if (!amount || !planName || !durationDays || !dailyROIPercentage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum investment amount is ₹100'
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(durationDays));

    const investment = await Investment.create({
      user: req.user._id,
      amount: Number(amount),
      plan: {
        name: planName,
        durationDays: Number(durationDays),
        dailyROIPercentage: Number(dailyROIPercentage)
      },
      startDate,
      endDate
    });

    // Distribute referral income to upline
    await distributeReferralIncome(req.user._id, investment._id, Number(amount));

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get user investments
 * @route   GET /api/investments
 * @access  Private
 */
exports.getUserInvestments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [investments, total] = await Promise.all([
      Investment.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Investment.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        investments,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get investment by ID
 * @route   GET /api/investments/:id
 * @access  Private
 */
exports.getInvestmentById = async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, user: req.user._id });

    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    res.status(200).json({ success: true, data: investment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
