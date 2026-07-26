const User = require('../models/User');
const LevelIncome = require('../models/LevelIncome');

/**
 * Level commission percentages (5 levels deep)
 * Level 1 (direct referrer): 5%
 * Level 2: 3%
 * Level 3: 2%
 * Level 4: 1%
 * Level 5: 0.5%
 */
const LEVEL_COMMISSIONS = {
  1: 5,
  2: 3,
  3: 2,
  4: 1,
  5: 0.5
};

/**
 * Distribute referral/level income to all upline users when a new investment is made.
 * Traverses the referral hierarchy up to the defined number of levels.
 * 
 * @param {ObjectId} investorId - The ID of the user who made the investment
 * @param {ObjectId} investmentId - The ID of the new investment
 * @param {number} investmentAmount - The amount invested
 */
const distributeReferralIncome = async (investorId, investmentId, investmentAmount) => {
  try {
    let currentUser = await User.findById(investorId);
    let level = 1;

    while (currentUser.referredBy && level <= Object.keys(LEVEL_COMMISSIONS).length) {
      const uplineUser = await User.findById(currentUser.referredBy);

      if (!uplineUser || uplineUser.accountStatus !== 'Active') {
        // Skip inactive users but continue traversal
        currentUser = uplineUser || null;
        if (!currentUser) break;
        level++;
        continue;
      }

      const commissionPercentage = LEVEL_COMMISSIONS[level];
      const incomeAmount = parseFloat(((investmentAmount * commissionPercentage) / 100).toFixed(2));

      // Record level income
      await LevelIncome.create({
        receiver: uplineUser._id,
        generator: investorId,
        investment: investmentId,
        level,
        amount: incomeAmount,
        percentage: commissionPercentage,
        date: new Date()
      });

      // Credit wallet balance and update total level income
      await User.findByIdAndUpdate(uplineUser._id, {
        $inc: {
          walletBalance: incomeAmount,
          totalLevelIncome: incomeAmount
        }
      });

      // Move up the tree
      currentUser = uplineUser;
      level++;
    }
  } catch (error) {
    // Log error but don't fail the investment creation
    console.error('Error distributing referral income:', error.message);
  }
};

module.exports = { distributeReferralIncome, LEVEL_COMMISSIONS };
