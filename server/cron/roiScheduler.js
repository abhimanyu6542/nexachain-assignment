const cron = require('node-cron');
const { processDailyROI } = require('../services/roiService');

/**
 * Cron Scheduler for Daily ROI Processing
 * 
 * Runs every day at 12:00 AM (midnight) server time.
 * Cron expression: '0 0 * * *' = At 00:00 every day.
 * 
 * Idempotency: The ROIHistory model has a unique compound index on
 * (investment + date), so even if this job runs multiple times on
 * the same day, ROI is credited only once per investment per day.
 */
const startROIScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Daily ROI job triggered at:', new Date().toISOString());

    try {
      const result = await processDailyROI();
      console.log('[Cron] ROI job completed:', JSON.stringify(result));
    } catch (error) {
      console.error('[Cron] ROI job failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('[Cron] Daily ROI scheduler registered — runs at 00:00 UTC daily');
};

module.exports = startROIScheduler;
