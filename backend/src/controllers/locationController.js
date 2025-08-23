const { StatusCodes } = require('http-status-codes');
const DriverLocation = require('../models/DriverLocation');

// Update driver location (called by driver app)


// Get specific driver's latest location
exports.getDriverLocation = async (req, res) => {
  try {
    const { driverId } = req.params;
    const location = await DriverLocation.findOne({ driver: driverId });

    if (!location) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Location not found' });
    }

    res.json(location);
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { coordinates, heading, speed, accuracy, isOnline } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Invalid coordinates [lng, lat] required' });
    }

    if (accuracy && accuracy > 100) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'GPS accuracy too low (>100m)' });
    }

    const location = await DriverLocation.findOneAndUpdate(
      { driver: req.user.id },
      {
        coords: { type: 'Point', coordinates },
        heading,
        speed,
        accuracy,
        isOnline: isOnline ?? true,
        lastPingAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Emit only to admins and users linked to trips involving this driver
    req.io.to("adminRoom").emit("locationUpdate", {
      driverId: req.user.id,
      coords: location.coords,
      heading,
      speed,
      accuracy,
      isOnline: location.isOnline
    });

    res.json(location);
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};
