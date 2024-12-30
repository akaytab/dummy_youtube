import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../model/video.model.js";
import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { getVideoDuration } from "../utils/videoDuration.js";



const getAllVideos =asyncHandlerPromise(async (req,res) => {
    ////////// Get all videos //////////
// 1. Get the page, limit, query, sortBy, sortType, userId from the request query(frontend) [http://localhost:8000/api/v1/video/all-video?page=1&limit=10&query=hello&sortBy=createdAt&sortType=1&userId=123]
// 2. Get all videos based on query, sort, pagination)
// 2.1 match the videos based on title and description
// 2.2 match the videos based on userId=Owner
// 3. lookup the Owner field of video and get the user details
// 4. addFields just add the Owner field to the video document
// 5. set options for pagination
// 6. get the videos based on pipeline and options

    const { page = 1, limit = 10, query, sortBy='createdAt', sortType=1, userId } = req.query

   let projectPipeline = [
        {
            $match:{
                $and:[
                    {
                        $or:[
                            {
                                title:{$regex:query,$options:'i'},
                                description:{$regex:query,$options:'i'},
                            }
                        ]
                    },
                    {
                        ...(userId?[{owner:mongoose.Types.ObjectId(userId)}]:'')
                    }
                ]
                
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:'$avatar.url'
                        }
                    }
                ]
            },
        },
        {
            $addFields:{
                owner:{
                    $first:'$owner',
                }
            }
        },
        {
            $sort:{
                [sortBy]:sortType
            }
        }
    ];

    try {
        const options = {
            page:parseInt( page),
            limit: parseInt(limit),
            customLabels:{
                totalDocs: "totalVideos",
                docs: "videos",
            }
        };
    
        const allVideos = await Video.aggregatePaginate(
            await Video.aggregate(projectPipeline),
            options
        );
    
        if(! allVideos?.length === 0){
            throw new ApiError(500,'something went wront while fetching videos')
        }
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            'all Videos Fetched',
            allVideos
        ))
    } catch (error) {
        throw new ApiError(500,'Internal server error')
    }  
})

const publishVideo = asyncHandlerPromise(async (req,res) => {
    const {title,description}=req.body;

    ////////// Publish a video //////////
// 1. Get the video file and thumbnail from the request body(frontend)
// 2. upload video and thumbnail to loacl storage and get the path
// 3. upload video and thumbnail to cloudinary 
// 4. create a video document in the database

    if(!(title && description)){
        throw new ApiError(400, 'title or description fiels is missing')
    }

    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath= req.files?.thumbnail[0].path;

    if(!videoLocalPath){
        throw new ApiError(400,'video file path is missing');
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,'thumbnail file path is missing')
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!video){
        throw new ApiError(500,'something went wrong while Uploading Video');
    }

    if(!thumbnail){
        throw new ApiError(500, 'soemthing went wrong while uploading thumbnail');
    }

    const duration = getVideoDuration(videoLocalPath);

    if(! duration){
        throw new ApiError(400,'cannot find duration of the video')
    }

    const publishedVideo = await Video.create({
        videoFile: video?.url,
        thumbnail:thumbnail?.url,
        title:title,
        description:description,
        duration:duration,
        isPublished:true,
        owner:req.user?._id

    })

    if(!publishedVideo){
        throw new ApiError(500,'error while uploading video');
    }

    return res
    .status(200)
    .json(new ApiResponse(200,
        'video uploaded successfully',
        publishedVideo
    ));
})

const getVideoById = asyncHandlerPromise(async (req,res) => {
    const {videoId}= req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,'invalid video Id');
    }
    
    const video = await Video.findById(videoId);

    if(! video){
        throw new ApiError(401,'failed to get video');
    }

    return res 
    .status(200)
    .json(new ApiResponse(
        200,
        'video detail fetched',
        video
    ))
})

const updateVideoDetails = asyncHandlerPromise(async (req,res) => {
    const {videoId} = req.param;

    const {title,description}=req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,'invalid video Id');
    }
    const video = await Video.findById(videoId);

    const newthumbnailLocalpath= req.file?.path;

    if(!newthumbnailLocalpath){
        throw new ApiError(401,'no file path found')
    }
    const newThumbnail=await uploadOnCloudinary(newthumbnailLocalpath);

    if(!newThumbnail.url){
        throw new ApiError(401,'cloudinary thumbnail path is missing')
    }

    const updateVideo = Video.findByIdAndUpdate(videoId,{
        $set:{
            title:title,
            description:description,
            thumbnail:newThumbnail.url,
        }
    },
    {
        new:true,
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        'video updated successfully',
        updateVideo
    ))
    
})

const deleteVideo = asyncHandlerPromise(async (req,res) => {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,'invalid video Id');
    }

    const video = await Video.findById(videoId);

    if(!video.owner.equals(req.user._id)){
        throw new ApiError(400,'you are not the owner of the video to delete')
    }

    if(!video){
        throw new ApiError(400,'video not available');
    }
    await video.remove();  

    return res
    .status(200)
    .json(new ApiResponse(200,
        'video deleted successfully',
        video
    ))
})

const togglePublish = asyncHandlerPromise(async (req,res) => {
    const {videoId}= req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,'invalid video Id');
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,'video not present')
    }

    if(!video.owner.equals(req.user._id)){
        throw new ApiError(400,'you are not the owner of the video to delete')
    }

    video.isPublished= ! video.isPublished;

    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        'toggle published done successfully',
        video
    ))
})

export {getAllVideos,publishVideo,getVideoById,updateVideoDetails,deleteVideo,togglePublish}