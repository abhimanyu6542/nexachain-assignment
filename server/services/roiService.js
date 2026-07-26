const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const User = require('../models/User');

/**
 * Get today's date at midnight (UTC) for consistent daily comparisons.
 * @returns {Date} Today's date at 00:00:00 UTC
 */
const getTodayDate = () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

/**
 * Process daily ROI for a single investment.
 * Uses an explicit findOne check + create pattern for idempotency — safe with Mongoose 7+.
 * The unique compound index on (investment, date) acts as a final safeguard against races.
 *
 * @param {Object} investment - Mongoose Investment document
 * @param {Date} processDate  - The date to process ROI for
 * @returns {Object} Result summary
 */
const processSingleInvestmentROI = async (investment, processDate) => {
  const roiAmount = parseFloat(
    ((investment.amount * investment.plan.dailyROIPercentage) / 100).toFixed(2)
  );

  try {
    // Check if already processed today (idempotency check)
    const existing = await ROIHistory.findOne({
      investment: investment._id,
      date: processDate
    });

    if (existing) {
      return { status: 'skipped', amount: 0, reason: 'Already processed for today' };
    }

    // Create ROI history record
    await ROIHistory.create({
      user: investment.user,
      investment: investment._id,
      amount: roiAmount,
      date: processDate,
      status: 'Credited',
      processedAt: new Date()
    });

    // Credit user wallet
    await User.findByIdAndUpdate(investment.user, {
      $inc: {
        walletBalance: roiAmount,
        totalROIEarned: roiAmount
      }
    });

    // Update investment totals
    await Investment.findByIdAndUpdate(investment._id, {
      $inc: { totalROIGenerated: roiAmount },
      lastROIProcessedDate: processDate
    });

    return { status: 'credited', amount: roiAmount };
  } catch (error) {
    // Duplicate key error from unique index = race condition, already processed
    if (error.code === 11000) {
      return { status: 'skipped', amount: 0, reason: 'Duplicate key — already processed' };
    }
    throw error;
  }
};

/**
 * Process daily ROI for ALL active investments.
 * Called by the cron job — idempotent, safe to run multiple times per day.
 *
 * @returns {Object} Summary of processing results
 */
const processDailyROI = async () => {
  const today = getTodayDate();

  console.log(`[ROI Service] Starting daily ROI processing for: ${today.toISOString()}`);

  const results = {
    processed: 0,
    skipped: 0,
    failed: 0,
    totalCredited: 0,
    date: today
  };

  const activeInvestments = await Investment.find({
    status: 'Active',
    startDate: { $lte: today },
    endDate: { $gte: today }
  });

  console.log(`[ROI Service] Found ${activeInvestments.length} active investments`);

  for (const investment of activeInvestments) {
    try {
      const result = await processSingleInvestmentROI(investment, today);

      if (result.status === 'credited') {
        results.processed++;
        results.totalCredited += result.amount;
      } else {
        results.skipped++;
      }

      // Mark investment as Completed if end date reached
      const endOfDay = new Date(today);
      endOfDay.setUTCHours(23, 59, 59, 999);

      if (investment.endDate <= endOfDay) {
        await Investment.findByIdAndUpdate(investment._id, { status: 'Completed' });
      }
    } catch (error) {
      results.failed++;
      console.error(`[ROI Service] Failed investment ${investment._id}:`, error.message);
    }
  }

  console.log(
    `[ROI Service] Done — Processed: ${results.processed}, Skipped: ${results.skipped}, ` +
    `Failed: ${results.failed}, Total Credited: ${results.totalCredited}`
  );

  return results;
};

module.exports = { processDailyROI, processSingleInvestmentROI, getTodayDate };
