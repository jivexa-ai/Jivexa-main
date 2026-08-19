import mongoose from "mongoose";

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jivexa_auth";
  const fallbackAtlasUri = "mongodb+srv://bhaimayank105_db_user:bMtDCYtcXrz4RVqf@cluster0.oyjmlu5.mongodb.net/jivexa_health_db?retryWrites=true&w=majority";

  try {
    await mongoose.connect(primaryUri);
    console.log(`[MongoDB Connected]: Connected to database`);
  } catch (err) {
    console.warn(`[MongoDB Warning]: Primary connection failed (${err.message}). Attempting fallback connection...`);
    try {
      await mongoose.connect(fallbackAtlasUri);
      console.log(`[MongoDB Connected]: Fallback connection established.`);
    } catch (fallbackErr) {
      console.error("[MongoDB Fatal]: All database connections failed:", fallbackErr.message);
      throw fallbackErr;
    }
  }
};

export default connectDB;