import mongoose from "mongoose";

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URL || process.env.MONGO_URI;

  if (!primaryUri) {
    throw new Error("[MongoDB Fatal Error]: MONGO_URL or MONGO_URI environment variable is missing.");
  }

  try {
    await mongoose.connect(primaryUri);
    console.log(`[MongoDB Connected]: Connected to database`);
  } catch (err) {
    console.error("[MongoDB Fatal]: Database connection failed:", err.message);
    throw err;
  }
};

export default connectDB;