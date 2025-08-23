const router = require('express').Router();
const { updateLocation, getDriverLocation } = require('../controllers/locationController');
const { auth, requireRole } = require('../middleware/auth');

// Driver updates their location
router.post('/', auth, requireRole('driver'), updateLocation);

// Admin/User fetch specific driver location by ID
router.get('/:driverId', auth, getDriverLocation);

module.exports = router;
