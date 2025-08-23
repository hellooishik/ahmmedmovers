const { StatusCodes } = require('http-status-codes');
const Trip = require('../models/Trip');
const { validateAndGeocodeUK } = require('../services/address');

// Create a trip (admin CSR)
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
      statusHistory: [{ status: 'created', by: req.user.id }]
    });

    req.io?.to('adminRoom')?.emit('trip:created', trip);
    res.status(StatusCodes.CREATED).json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// User self-service booking
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
      statusHistory: [{ status: 'created', by: req.user.id }]
    });
    res.status(StatusCodes.CREATED).json(trip);
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

// Assign driver
exports.assignDriver = async (req, res) => {
  const { driverId } = req.body;
  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { driver: driverId, $push: { statusHistory: { status: 'assigned', by: req.user.id } } },
    { new: true }
  ).populate('user driver','name email');
  res.json(trip);
};

// Add leg (multi-driver handover)
exports.addLeg = async (req, res) => {
  const { fromHub, toHub, driverId } = req.body;
  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { $push: { legs: { fromHub, toHub, driver: driverId, status: 'pending' } } },
    { new: true }
  );
  res.json(trip);
};

// Update status
exports.updateTripStatus = async (req, res) => {
  const { status, note } = req.body;
  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { status, $push: { statusHistory: { status, by: req.user.id, note } } },
    { new: true }
  ).populate('user driver','name email');
  req.io?.to('adminRoom')?.emit('trip:status', { id: trip._id, status: trip.status });
  res.json(trip);
};

// POD upload
exports.uploadPOD = async (req, res) => {
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
};

// Basic listing (admin)
exports.getTrips = async (_req, res) => {
  const trips = await Trip.find().sort({ createdAt: -1 }).populate('user driver','name email');
  res.json(trips);
};

// By code (public/user)
exports.getTripByCode = async (req, res) => {
  const { code } = req.params;
  const trip = await Trip.findOne({ code }).populate('user driver','name email');
  if (!trip) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Trip not found' });
  res.json(trip);
};