const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');

// List all drivers
exports.getDrivers = async (req, res) => {
  const drivers = await User.find({ role: 'driver' }).select('-password');
  res.json(drivers);
};

// Update driver status (available, on-trip, offline)
exports.updateDriverStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const driver = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!driver) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Driver not found' });
  res.json(driver);
};
