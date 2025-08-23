const router = require('express').Router();
const { getDrivers, updateDriverStatus } = require('../controllers/driverController');
const { auth, requireRole } = require('../middleware/auth');

console.log("DEBUG driverRoutes:", { getDrivers, updateDriverStatus, auth, requireRole });

router.get('/', auth, requireRole(['admin']), getDrivers);
router.patch('/:id/status', auth, requireRole(['admin']), updateDriverStatus);

module.exports = router;
