const router = require('express').Router();
const { auth } = require('../middleware/auth');   // ✅ destructure correctly
const { createCheckout, webhook } = require('../controllers/paymentsController');

router.post('/checkout', auth, createCheckout);
router.post('/webhooks/stripe', webhook);

module.exports = router;
