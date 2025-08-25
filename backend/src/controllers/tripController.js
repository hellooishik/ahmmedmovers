const { StatusCodes } = require('http-status-codes');
const Trip = require('../models/Trip');
const { validateAndGeocodeUK } = require('../services/address');

// ========== Create Trip (Admin CSR) ==========
exports.createTrip = async (req, res) => {
  try {
    const { pickupAddress, dropAddress, parcel, payment } = req.body;

    const pickup = await validateAndGeocodeUK(pickupAddress);
    const drop   = await validateAndGeocodeUK(dropAddress);

    const trip = await Trip.create({
      user: req.user.id,
      pickupAddress: pickup,
      dropAddress: drop,
      parcel,
      payment: payment || { status: 'unpaid' },
      status: 'created',
      statusHistory: [{ status: 'created', by: req.user.id }]
    });

    req.io?.to('adminRoom')?.emit('trip:created', trip);
    res.status(StatusCodes.CREATED).json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// ========== User Self-service Booking ==========
exports.requestTrip = async (req, res) => {
  try {
    const { pickupAddress, dropAddress, parcel } = req.body;
    const pickup = await validateAndGeocodeUK(pickupAddress);
    const drop   = await validateAndGeocodeUK(dropAddress);

    const trip = await Trip.create({
      user: req.user.id,
      pickupAddress: pickup,
      dropAddress: drop,
      parcel,
      payment: { status: 'unpaid' },
      status: 'created',
      statusHistory: [{ status: 'created', by: req.user.id }]
    });

    res.status(StatusCodes.CREATED).json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// ========== Assign Driver ==========
exports.assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Trip not found' });
    }

    trip.driver = driverId;
    trip.status = 'assigned';
    trip.statusHistory.push({
      status: 'assigned',
      by: req.user.id,
      note: `Assigned to driver ${driverId}`
    });

    await trip.save();
    await trip.populate('user driver', 'name email');

    // Notify driver of assignment
    req.io?.to(`driver:${driverId}`)?.emit('trip:assigned', {
      id: trip._id,
      code: trip.code,
      pickup: trip.pickupAddress,
      drop: trip.dropAddress
    });

    // Notify admins
    req.io?.to('adminRoom')?.emit('trip:status', {
      id: trip._id,
      status: trip.status
    });

    res.json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// ========== Driver Response (Accept/Reject) ==========
exports.respondToAssignment = async (req, res) => {
  try {
    const { response } = req.body; // "accepted" or "rejected"
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Trip not found' });

    if (!trip.driver || trip.driver.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are not assigned to this trip' });
    }

    if (response === 'accepted') {
      trip.status = 'driver_accepted';
    } else {
      trip.status = 'driver_rejected';
      trip.driver = null; // free up trip for reassignment
    }

    trip.statusHistory.push({ status: trip.status, by: req.user.id });
    await trip.save();
    await trip.populate('user driver', 'name email');

    // Notify admins & user
    req.io?.to('adminRoom')?.emit('trip:status', { id: trip._id, status: trip.status });
    req.io?.to(`user:${trip.user._id}`)?.emit('trip:status', { id: trip._id, status: trip.status });

    res.json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// ========== Add Leg (Multi-driver Handover) ==========
exports.addLeg = async (req, res) => {
  try {
    const { fromHub, toHub, driverId } = req.body;
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { $push: { legs: { fromHub, toHub, driver: driverId, status: 'pending' } } },
      { new: true }
    );
    res.json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// ========== Update Status ==========
exports.updateTripStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { status, $push: { statusHistory: { status, by: req.user.id, note } } },
      { new: true }
    ).populate('user driver','name email');

    req.io?.to('adminRoom')?.emit('trip:status', { id: trip._id, status: trip.status });
    res.json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// ========== Upload POD ==========
exports.uploadPOD = async (req, res) => {
  try {
    const { deliveredAt, recipientName, recipientNote } = req.body;
    const signatureUrl = req.files?.signature?.[0]?.path;
    const deliveredPhotoUrl = req.files?.photo?.[0]?.path;

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      {
        pod: { deliveredAt, deliveredBy: req.user.id, signatureUrl, deliveredPhotoUrl, recipientName, recipientNote },
        status: 'delivered',
        $push: { statusHistory: { status: 'delivered', by: req.user.id } }
      },
      { new: true }
    );

    req.io?.to('adminRoom')?.emit('trip:delivered', { id: trip._id });
    res.json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// ========== Get Trips (Admin) ==========
exports.getTrips = async (_req, res) => {
  const trips = await Trip.find().sort({ createdAt: -1 }).populate('user driver','name email');
  res.json(trips);
};

// ========== Get Trip by Code ==========
exports.getTripByCode = async (req, res) => {
  const { code } = req.params;
  const trip = await Trip.findOne({ code }).populate('user driver','name email');
  if (!trip) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Trip not found' });
  res.json(trip);
};
