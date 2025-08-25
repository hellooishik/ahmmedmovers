const router = require('express').Router();
const { getDrivers, updateDriverStatus, createDriver } = require('../controllers/driverController');
const { auth, requireRole } = require('../middleware/auth');

console.log("DEBUG driverRoutes:", { getDrivers, updateDriverStatus, createDriver, auth, requireRole });

// Create a new driver (Admin only)
router.post('/', auth, requireRole(['admin']), createDriver);

// Get all drivers (Admin only)
router.get('/', auth, requireRole(['admin']), getDrivers);

// Update driver status (Admin only)
router.patch('/:id/status', auth, requireRole(['admin']), updateDriverStatus);

module.exports = router;
