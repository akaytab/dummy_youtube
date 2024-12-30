import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import { Comment } from "../model/comment.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../model/video.model.js";

const getVideoComments = asyncHandlerPromise(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query;

   try {
     let projectPipeline = await Comment.aggregate ([
         {
             $match:{
                 video: mongoose.Types.ObjectId(videoId),
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
                             avatar:1,
                             username:1,
                         }
                     }
                 ]
 
             }
         },
         {
             $addFields:{
                 likes:{
                     $size:'$likes',
                 }
             }
         },
         {
             $project:{
                 content:1,
                 owner:1,
                 likes:1,
             }
         }
 
     ])
 
     const options={
         page:parseInt(page),
         limit:parseInt(limit),
         customLabels: {
             totalDocs: "total_comments",
             docs: "Comments"
         }
     }
 
     const getallComments = await Comment.aggregatePaginate(projectPipeline,options)
 
     if(!getallComments){
         throw new ApiError(500,'something went wrong while fetching all comments')
     }
     return res
     .status(200)
     .json(new ApiResponse(200,'all comments fetched',getallComments))
   } catch (error) {
    throw new ApiError(500,error.message);
   }
})

const addComment = asyncHandlerPromise(async (req,res) => {
    const {content} = req.body;
    const {videoId}= req.params;

    if(!content){
        throw new ApiError(400,'no content available')
    }

    const createComment = await Comment.create({
        content:content,
        video: videoId,
        owner: req.user?._id,
    })

    if(!createComment){
        throw new ApiError(500,'something went wrong while creating comment')
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        'comment successfully created',
        createComment,
    ))
    
})

const updateComment =asyncHandlerPromise(async (req,res) => {
    const {content}  = req.body;
    const {commentId} = req.params;

    if(! isValidObjectId(commentId)){
        throw new ApiError(401,'comment Id is not valid')
    }

    if(!content){
        throw new ApiError(400,'no content available')
    }

    const comment= await Comment.findById(commentId)

    if(!(await comment.owner.equals(req.user._id))){
        throw new ApiError(429, ' you cannot edit the comment ')
    }

    comment.content = content;

    await comment.save();

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        'comment successfully edited',
        comment,
    ))

    
})

const deleteComment =  asyncHandlerPromise(async (req,res) => {
    const {commentId , videoId} = req.params;

    if(! isValidObjectId(commentId)){
        throw new ApiError(400,'comment Id is not valid ')
    }
    
    const comment = await Comment.findById(commentId);
    const video = await Video.findById(videoId);

    if(!comment ){
        throw new ApiError(400,'comment cannot be found')
    }

    if(!video ){
        throw new ApiError(400,'video cannot be found')
    }

    if(!((comment.owner.equals(req.user?._id))||(video.owner.equals(req.user?._id)))){
        throw new ApiError(429,'you dont have permission to delete the comment')
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment){
        throw new ApiError(500,'something went wrong while deleting comment')
    }

    return res
    .status(200)
    .json(new ApiResponse(200,
        'comment deleted successfully',
        deletedComment
    ))


    
})

export{getVideoComments,addComment,updateComment,deleteComment}