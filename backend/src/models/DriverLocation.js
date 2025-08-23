const mongoose = require('mongoose');

const DriverLocationSchema = new mongoose.Schema(
{
driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
coords: {
type: { type: String, enum: ['Point'], default: 'Point' },
coordinates: { type: [Number], required: true }, // [lng, lat]
},
heading: { type: Number },
speed: { type: Number },
accuracy: { type: Number },
isOnline: { type: Boolean, default: false, index: true },
lastPingAt: { type: Date, default: Date.now, index: true },
},
{ timestamps: true }
);

DriverLocationSchema.index({ coords: '2dsphere' });

module.exports = mongoose.model('DriverLocation', DriverLocationSchema);