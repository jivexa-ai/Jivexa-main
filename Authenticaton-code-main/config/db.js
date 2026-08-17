import mongoose from "mongoose";

const connectDB = async () => {

    if (!process.env.MONGO_URL) {
        throw new Error("MONGO_URI is missing");
    }
   
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB Connected");
};

export default connectDB;