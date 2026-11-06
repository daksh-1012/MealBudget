const mongoose = require('mongoose');

module.exports = async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set. Copy .env.example to .env first.');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set. Copy .env.example to .env first.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};
