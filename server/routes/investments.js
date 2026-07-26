const express = require('express');
const router = express.Router();
const {
  createInvestment,
  getUserInvestments,
  getInvestmentById,
  getPlans,
  triggerROI
} = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Available investment plans
router.get('/plans', getPlans);

// Manually trigger ROI (dev/test only)
router.post('/trigger-roi', triggerROI);

router.route('/')
  .get(getUserInvestments)
  .post(createInvestment);

router.route('/:id')
  .get(getInvestmentById);

module.exports = router;
