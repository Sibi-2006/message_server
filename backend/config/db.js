const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    // If db password is not replaced yet, log helpful prompt without crashing immediately during initial app setup
    if (process.env.MONGO_URI.includes('<db_password>')) {
      console.warn('[MongoDB Warning] Please update MONGO_URI in backend/.env with your actual password.');
    }
  }
};

module.exports = connectDB;
