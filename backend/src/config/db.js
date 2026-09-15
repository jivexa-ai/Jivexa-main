const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || process.env.DATABASE_URL;

    if (!mongoURI) {
      console.warn('[MongoDB] MONGO_URI / MONGO_URL is not defined. In-memory mode active.');
      return;
    }

    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      autoIndex: true,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(
      `[MongoDB] Connected to database host: ${conn.connection.host}`
    );
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`); 
  }
};

module.exports = connectDB;