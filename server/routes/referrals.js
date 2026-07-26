const express = require('express');
const router = express.Router();
const { getDirectReferrals, getReferralTree } = require('../controllers/referralController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/direct', getDirectReferrals);
router.get('/tree', getReferralTree);

module.exports = router;
