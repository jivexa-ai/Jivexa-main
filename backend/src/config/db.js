const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI is missing in .env');
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