const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  createTrip, requestTrip, assignDriver, updateTripStatus,
  addLeg, uploadPOD, getTrips, getTripByCode
} = require('../controllers/tripController');

// Admin
router.post('/', auth, createTrip);
router.get('/', auth, getTrips);
router.post('/:id/assign', auth, assignDriver);
router.post('/:id/status', auth, updateTripStatus);
router.post('/:id/legs', auth, addLeg);

// User
router.post('/request', auth, requestTrip);

// Public/User tracking
router.get('/code/:code', getTripByCode);

// POD (driver)
router.post(
  '/:id/pod',
  auth,
  upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  uploadPOD
);

module.exports = router;
