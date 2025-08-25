const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');

// Create a new driver
exports.createDriver = async (req, res) => {
  try {
    let { name, email, phone, password, licenseNumber, vehicleType } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !licenseNumber || !vehicleType) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'All fields (name, email, phone, password, licenseNumber, vehicleType) are required' });
    }

    // Normalize email
    email = email.toLowerCase();

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Email already exists' });
    }

    // Create driver
    const driver = new User({
      name,
      email,
      phone,
      password, // Will be hashed in pre-save hook
      role: 'driver',
      accountStatus: 'active',   // driver account active by default
      driverStatus: 'available', // availability when created
      licenseNumber,
      vehicleType,
    });

    await driver.save();

    // Fetch driver without password
    const driverResponse = await User.findById(driver._id).select('-password');

    res.status(StatusCodes.CREATED).json(driverResponse);
  } catch (error) {
    console.error('Error creating driver:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Server error while creating driver' });
  }
};

// List all drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password');
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to fetch drivers' });
  }
};

// Update driver availability status (available, on-trip, offline)
exports.updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverStatus } = req.body;

    // Validate status
    if (!['available', 'on-trip', 'offline'].includes(driverStatus)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Invalid driver status. Must be available, on-trip, or offline' });
    }

    const driver = await User.findByIdAndUpdate(
      id,
      { driverStatus },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to update driver status' });
  }
};
