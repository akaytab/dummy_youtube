import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";



const verifyJwt = asyncHandlerPromise(async (req,_,next) => {
  try {
     const token =req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ','');
     
     if(!token){
      throw new ApiError(401,'Unauthorized request')
     }
  
     const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
     const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
  
     if(!user){
      throw new ApiError(401,'Invalid access Token')
     }
  
     req.user=user;
     next();
  } catch (error) {
    throw new ApiError(401,error?.message || 'Invalid access Token')
  }
    
})



export  {verifyJwt};