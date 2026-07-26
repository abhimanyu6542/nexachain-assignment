const User = require('../models/User');

/**
 * @desc    Get direct referrals
 * @route   GET /api/referrals/direct
 * @access  Private
 */
exports.getDirectReferrals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const referrals = await User.find({ referredBy: req.user._id })
      .select('fullName email mobile referralCode walletBalance totalROIEarned totalLevelIncome accountStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ referredBy: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        referrals,
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
 * @desc    Get referral tree (hierarchical structure)
 * @route   GET /api/referrals/tree
 * @access  Private
 */
exports.getReferralTree = async (req, res) => {
  try {
    const buildTree = async (userId, level = 1, maxLevel = 5) => {
      if (level > maxLevel) return [];

      const referrals = await User.find({ referredBy: userId })
        .select('fullName email referralCode walletBalance totalROIEarned createdAt')
        .lean();

      const tree = [];
      for (const referral of referrals) {
        const children = await buildTree(referral._id, level + 1, maxLevel);
        tree.push({
          ...referral,
          level,
          children
        });
      }

      return tree;
    };

    const tree = await buildTree(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          fullName: req.user.fullName,
          referralCode: req.user.referralCode
        },
        tree
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
