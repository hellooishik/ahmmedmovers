const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city:  { type: String, required: true },
  postcode: { type: String, required: true }, // UK postcode
  country: { type: String, default: 'GB' },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined } // [lng, lat]
  }
}, { _id: false });

const ParcelSchema = new mongoose.Schema({
  description: String,
  category: { type: String, enum: ['standard','documents','electronics','fragile','perishable','other'], default: 'standard' },
  weightKg: { type: Number, required: true },
  lengthCm: Number,
  widthCm: Number,
  heightCm: Number,
  fragile: { type: Boolean, default: false },
  insurance: {
    enabled: { type: Boolean, default: false },
    declaredValueGBP: { type: Number, default: 0 }
  },
  deliveryInstructions: String
}, { _id: false });

const LegSchema = new mongoose.Schema({
  fromHub: String,
  toHub: String,
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending','in-progress','completed','canceled'], default: 'pending' },
  startedAt: Date,
  completedAt: Date
}, { _id: true });

const PODSchema = new mongoose.Schema({
  deliveredAt: Date,
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  signatureUrl: String,
  deliveredPhotoUrl: String,
  recipientName: String,
  recipientNote: String
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  status: { type: String, enum: ['unpaid','pending','paid','failed','refunded'], default: 'unpaid' },
  amountGBP: Number,
  stripeSessionId: String,
  stripePaymentIntentId: String
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  status: String,
  at: { type: Date, default: Date.now },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: String
}, { _id: false });

const tripSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // creator / customer
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },                // current driver
  pickupAddress: { type: AddressSchema, required: true },
  dropAddress:   { type: AddressSchema, required: true },
  parcel: { type: ParcelSchema, required: true },
  status: { type: String, enum: ['created','assigned','out-for-pickup','in-transit','out-for-delivery','delivered','canceled'], default: 'created' },
  legs: [LegSchema],
  pod: PODSchema,
  payment: PaymentSchema,
  statusHistory: [StatusHistorySchema]
}, { timestamps: true });

// Auto-generate code if not provided
tripSchema.pre('validate', function(next) {
  if (!this.code) {
    this.code = 'TRIP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

tripSchema.index({ 'pickupAddress.coordinates': '2dsphere' });
tripSchema.index({ 'dropAddress.coordinates': '2dsphere' });

module.exports = mongoose.model('Trip', tripSchema);