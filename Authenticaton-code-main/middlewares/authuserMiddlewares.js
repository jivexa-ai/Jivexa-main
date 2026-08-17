
import User from "../model/userSchema.js";
import jwt from "jsonwebtoken";

const authUserMiddlewares = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: "Please login first"
            });
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const existingUser = await User.findById(payload.id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User doesn't exist"
            });
        }
         req.user = existingUser;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
};
export default authUserMiddlewares;