require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const adminExists = await User.findOne({ email: 'admin@ahmmedmovers.co.uk' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit(0);
    }

    await User.create({
      name: 'Super Admin',
      email: 'admin@ahmmedmovers.co.uk',
      password: 'Admin@123', // Will be hashed by User model pre-save hook
      role: 'admin',
      phone: '0000000000'
    });

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
})();
