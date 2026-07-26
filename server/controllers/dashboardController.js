const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const LevelIncome = require('../models/LevelIncome');
const User = require('../models/User');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with latest data
    const user = await User.findById(userId);

    // Calculate total investments
    const totalInvestments = await Investment.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Count active investments
    const activeInvestments = await Investment.countDocuments({
      user: userId,
      status: 'Active'
    });

    res.status(200).json({
      success: true,
      data: {
        totalInvestments: totalInvestments[0]?.total || 0,
        activeInvestments,
        totalROIEarned: user.totalROIEarned,
        totalLevelIncome: user.totalLevelIncome,
        walletBalance: user.walletBalance,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get ROI history
 * @route   GET /api/dashboard/roi-history
 * @access  Private
 */
exports.getROIHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const roiHistory = await ROIHistory.find({ user: req.user._id })
      .populate('investment', 'amount plan')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ROIHistory.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        roiHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get level income history
 * @route   GET /api/dashboard/level-income
 * @access  Private
 */
exports.getLevelIncomeHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const levelIncome = await LevelIncome.find({ receiver: req.user._id })
      .populate('generator', 'fullName email')
      .populate('investment', 'amount')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LevelIncome.countDocuments({ receiver: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        levelIncome,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
