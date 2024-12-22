import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../model/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser= asyncHandlerPromise(async (req,res) => {
    /** steps to do 
     * --> get user Details from FE/ payload
     * --> validation - not empty
     * --> check if the user is already exist: username ,email
     * --> check the image , check for avatar
     * --> upload in cloudinary 
     * --> create a user object ; create entry i database
     * --> remove password and token field from response
     * --> check for user creation
     * --> return res
     */

    const {email,username,fullName,password}=req.body;

    if(
        [email,username,fullName,password].some((field)=>
            field?.trim() === ""
        )
    ){
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = User.findOne(
        {
            $or:[{username},{email}]
        }
    )
    if(existedUser){
        throw new ApiError(409 , 'user with email and username already exist');
    }

   const avatarLocalPath= req.files?.avatar[0]?.path;
   const coverimgPath =req.files?.avatar[0]?.path;

   if(!avatarLocalPath){
    throw new ApiError(400,'avatar image is required');
   }

  const avatar= await uploadOnCloudinary(avatarLocalPath);
  const coverImage= await uploadOnCloudinary(coverimgPath);

  if(!avatar){
    throw new ApiError(400,'avatar image is required');
   }

   const user= await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   })

   const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"
   );
   if(!createdUser){
    throw new ApiError(500,'something went wrong while registering the user');
   }

   return res.status(201).json(new ApiResponse(200,"user created",createdUser))

})

export {registerUser}