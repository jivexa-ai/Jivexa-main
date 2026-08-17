import express from "express";
import { login, logout, signup, profile } from "../controller/userController.js";
import authUserMiddlewares from "../middlewares/authuserMiddlewares.js";

const userRouter = express.Router();

userRouter.post("/login", login);
userRouter.post("/logout", logout);
userRouter.post("/signup", signup);
userRouter.get("/profile",authUserMiddlewares, profile);

export default userRouter;