const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['admin', 'user', 'driver'],
      default: 'user',
    },

    // Account status (active/inactive)
    accountStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // the set of integers will be set to the main frame of the otal 
    // Driver-specific availability (only used if role === 'driver')
    driverStatus: {
      type: String,
      enum: ['available', 'on-trip', 'offline'],
      default: 'available',
    },

    // Optional: useful if you want to store driver details
    licenseNumber: { type: String },
    vehicleType: { type: String }, // e.g. car, van, truck
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password during login
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
