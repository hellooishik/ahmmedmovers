const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

async function connectDB() {
mongoose.set('strictQuery', true);
await mongoose.connect(MONGO_URI, {
autoIndex: true,
serverSelectionTimeoutMS: 10000,
});
console.log('MongoDB connected');
}

async function disconnectDB() {
await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };