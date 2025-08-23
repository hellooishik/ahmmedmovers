const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

router.use('/auth', require('./authRoutes'));
router.use('/drivers', require('./driverRoutes'));
router.use('/trips', require('./tripRoutes'));
router.use('/locations', require('./locationRoutes'));

module.exports = router;
