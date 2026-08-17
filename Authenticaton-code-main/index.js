import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRouter from './routes/userRouter.js';
import User from './model/userSchema.js'
import cookieParser from 'cookie-parser';


dotenv.config();
const app=express();


app.use(express.json());
app.use(cookieParser());


app.use("/user",userRouter)




const PORT=process.env.PORT||5000;
const startServer=async ()=>{
    try{
        await connectDB();
        app.listen(PORT ,()=>{
            console.log(`server start at ${PORT}`)
        })

    }catch(error){
        console.log(error)
    }
}
startServer();