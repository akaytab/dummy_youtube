import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../model/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken';


const generateAccessandRefreshToken = async (userID) => {
    try {
       const user= await User.findById(userID);
       
       const accessToken = user.generateAccessToken();
       const refreshToken= user.generateRefreshToken();

       user.refreshToken= await refreshToken;
      await user.save({ validateBeforeSave: false });
      return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,'something went wrong while generating tokens')
    }
}

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
    console.log(req.body);

    if(
        [email,username,fullName,password].some((field)=>
            field?.trim() === ""
        )
    ){
        throw new ApiError(400,`some fields are missing  please check and fill the missing fields`);
    }

    const existedUser = await User.findOne(
        {
            $or:[{username},{email}]
        }
    )
    if(existedUser){
        throw new ApiError(409 , 'user with email and username already exist');
    }

   const avatarLocalPath= req.files?.avatar[0]?.path;

   let coverImgPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImgPath =req.files?.coverImage[0]?.path;
   }

   if(!avatarLocalPath){
    throw new ApiError(400,'avatar image is required');
   }

  const avatar= await uploadOnCloudinary(avatarLocalPath);
  const coverImage= await uploadOnCloudinary(coverImgPath);

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

const loginUser =asyncHandlerPromise(async (req,res) => {
    /** steps for login to handel 
     * --> accept username /email and pasword 
     * --> validate username /email and password with Database
     * --> if validation is true generate a access token for the user 
     * --> after login generate a refresh token 
     * --> return login success full
     * -->send cookie
    */

    const {email,username,password}= req.body;
    
    if(!(username || email)){
        throw new ApiError (404,'username or email is required')
    }

  const user= await User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404,'user dosenot exist')
    }

    const ispassValid=await user.isPasswordCorrect(password);
    if(!ispassValid){
        throw new ApiError(401,'password incorrect')
    }

    console.log(user._id);
    
   const{accessToken,refreshToken}=await generateAccessandRefreshToken(user._id);

   const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

   const options =  {
    httpOnly: true,
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.header('authorization', `Bearer ${accessToken}`)
.json(
    new ApiResponse(
        200, 
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    )
)

})


const logOutUser = asyncHandlerPromise(async (req,res) => {
    
    User.findByIdAndUpdate(req.user._id,
        {
            $set:{refreshToken:undefined}
        },
        {
            new: true,
        },
    )
    const options ={
        httpOnly:true,

    }

    return res
    .status(200)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(
        new ApiResponse(200,'user logged out successfully',{}
        )
    )
    
})

const incomingRefreshToken = asyncHandlerPromise(async (req,res) => {
   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,'unauthorized request');
    }

  try {
    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken._id);
    if(user?.refreshToken !== incomingRefreshToken){
      throw new ApiError(401,'Refresh Token Expired');
    }
  
    const options={
      httpOnly:true,
    }
   const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id);
   console.log(accessToken,refreshToken);
   
  
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(200,
        'access Token Refreshed Successfully',
          {accessToken,refreshToken}
          
      )
   )
  
  } catch (error) {
    throw new ApiError(401,error?.message || 'invalid refresh Token')
    
  }
    
})

const changePassword = asyncHandlerPromise(async (req,res) => {
    const {oldPassword ,newPassword,confirmPassword} = req.body;

    if(newPassword !== confirmPassword){
        throw new ApiError(401,'newPassword dosenot match with confirm password')
    }
    
    const user= await User.findById(req.body._id);
    const checkPass = user.isPasswordCorrect(oldPassword);
     if(! checkPass){
        throw new ApiError(401,'Invalid old password')
     }

     user.password=newPassword;
     await user.save({validateBeforeSave:false});

     return res
     .status(200)
     .json(
        new ApiResponse (200,'password successfully changed')
     )
})

const getCurrentUser =asyncHandlerPromise(async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200,'current user fetched Successfully',req.user))
    
})

const updateUser = asyncHandlerPromise(async (req,res) => {
    const {fullName,email}=req.body;

    if(!(fullName || email)){
        throw new ApiError(401,'email or fullname is required');
    }
    
    const user = await User.findByIdAndUpdate(req.body._id,
        {
            $set:{
                fullName,email
            }
        },
        {new:true}
    ).select('-password');

    return res 
    .status(200)
    .json(new ApiResponse(200,'updated successfully',user))
    
})

const updateUserAvatar =asyncHandlerPromise(async (req,res) => {
    const localFilePath = req.file?.path;
     
    if(!localFilePath){
        throw new ApiError(401, 'avatar : file missing')
    }

    const avatar = await uploadOnCloudinary(localFilePath);
    if(!avatar.url){
        throw new ApiError(401,'Error while uploading')
    }

  const user=  User.findByIdAndUpdate(req.user?._id,{
        $set: {
            avatar:avatar.url,
        }
    },{
        new:true,
    }).select('-password');

    return res 
    .status(200)
    .json(new ApiResponse(200,
        'avatar updated successfully',
        user
    ))
})

const updateUserCoverImg =asyncHandlerPromise(async (req,res) => {
    const localFilePath = req.file?.path;
     
    // if(!localFilePath){
    //     throw new ApiError(401, 'coverI : file missing')
    // }

    const coverImage = await uploadOnCloudinary(localFilePath);
    if(!coverImage.url){
        throw new ApiError(401,'Error while uploading')
    }

   const user= User.findByIdAndUpdate(req.user?._id,{
        $set: {
            coverImage:coverImage.url,
        }
    },{
        new:true,
    }).select('-password');
    
    return res 
    .status(200)
    .json(new ApiResponse(200,
        'coverImage updated successfully',
        user
    ))
})

export {registerUser,loginUser,logOutUser,incomingRefreshToken,changePassword,getCurrentUser,updateUser,updateUserAvatar,updateUserCoverImg}