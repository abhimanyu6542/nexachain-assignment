const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getROIHistory,
  getLevelIncomeHistory
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/roi-history', getROIHistory);
router.get('/level-income', getLevelIncomeHistory);

module.exports = router;
