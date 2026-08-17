import mongoose from "mongoose"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import User from "../model/userSchema.js";
import cookieParser from "cookie-parser";
import authUserMiddlewares from "../middlewares/authuserMiddlewares.js";
import { signupSchema,loginSchema } from "../validators/userValidators.js";


   

const Createtoken=(id,email)=>{
    if(!process.env.JWT_SECRET){
        throw new Error("JWT key if not found")
    }
    const token=jwt.sign({id,email},process.env.JWT_SECRET,{expiresIn:"1h"});
    return token;
}

const Createcookie={
    httpOnly:true,
    secure:false,
    maxAge:60*60*1000
}


export const signup=async(req,res)=>{
    try{
        const result=signupSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                message:result.error.details[0].message
            })
        }


        const {name,age,email,password}=result.data;
        

        const user=await User.findOne({email});
        if(user){
            return res.status(409).json({
                message:"Email Id alerdy exist"
            })
        }
     
        const hashpassword=await bcrypt.hash(password,12);

        const userCreate=User.create({
            name,age,email,password:hashpassword
        })

     const token=Createtoken(userCreate._id,email);

     res.cookie("token",token,Createcookie);

     res.status(201).json({
        message:"User create successfully",
        name,age,email,password
     })
    }catch(error){
     console.log(error);
     res.status(500).json({
        message:"internal server errror"
     })
    }
}


export const login=async(req,res)=>{
    try{
  

         const result=loginSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                message:result.error.details[0].message
            })
        }
        const {email,password}=result.data;
        
         const existinguser=await User.findOne({email});
        if(!existinguser){
            return res.status(401).json({
                message:"invalide credentials"
            })
        }

        const isMatch=await bcrypt.compare(password,existinguser.password);
         if(!isMatch){
            return res.status(401).json({
                message:"invalide credentials"
            })
         }
         const token=Createtoken(existinguser._id,email);

         res.cookie("token",token,Createcookie);
         res.status(200).json({
            message:"User logged in successfully",
            name:existinguser.name,
            age:existinguser.age,
            email:existinguser.email,
            usage:existinguser.usage
         });

    }catch(error){
        console.log(error);
        res.status(500).json({
            message:"internal error"
        })
    }   
}


export const logout=async(req,res)=>{
    res.clearCookie("token",{
        httpOnly:true,
        secure:false,
    })
    res.status(200).json({
        message:"User logout in successfully"
    })
    
}

// export const profile=async(req,res)=>{
//     try{

//         const {email}=req.body;
//         if(!email){
//             return res.stats(400).json({
//                 message:"email not found"
//             })
//         }

//           const existinguser=await User.findOne({email});
//         if(!existinguser){
//             return res.stats(401).json({
//                 message:"invalide credentials"
//             })
//         }

//         res.stats(200).json({
//             name:existinguser.name,
//             age:existinguser.age,
//             email:existinguser.email,
//             usage:existinguser.usage
//         })

//     }catch(error){
//         console.log(error);
//         res.stats(500).json({
//             message:"internal server error"
//         })
//     }
    
// }

export const profile=async(req,res)=>{
    try{
         res.status(200).json({
            name:req.user.name,
            age:req.user.age,
            email:req.user.email,
            usage:req.user.usage
        })

    }catch(error){
        console.log(error);
        res.status(500).json({
            message:"internal server error"
        })
    }
}