const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('[MongoDB Warning] MONGO_URI environment variable is not set.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    if (process.env.MONGO_URI && process.env.MONGO_URI.includes('<db_password>')) {
      console.warn('[MongoDB Warning] Please update MONGO_URI on Render with your actual password.');
    }
  }
};

module.exports = connectDB;
