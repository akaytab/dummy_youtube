import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/apiResponse.js";
import { Like } from "../model/like.model.js";


const toggelVideoLike = asyncHandlerPromise(async (req,res) => {
    const {videoId}= req.params;

    if(! isValidObjectId(videoId)){
        throw new ApiError(400,'video Id is not vallid')
    }

    const likedVideo = await Like.findOne(
        {
            $and:[
                {
                    user: req.user?._id,
                },
                {
                    video:videoId,
                }
            ]
        }
    )

    if(!likedVideo){
        const likeVideo = await Like.create(
            {
                user: req.user?._id,
                video:videoId,
            }
        )

        return res
        .status(200)
        .json(new ApiResponse(200,
            'video liked successfully',
            likeVideo
        ))
    }

    if(likedVideo){
        const unlikeVideo = await Like.findByIdAndDelete(likedVideo._id)

        return res
        .status(200)
        .json(new ApiResponse(200,
            'video liked successfully',
            unlikeVideo
        ))
    }   
})

const toggleCommentLike = asyncHandlerPromise(async (req,res) => {
    const {commentId} = req.params;

    const likedComment = await Like.findOne({
        $and:[
            {
                user: req.user?._id
            },
            {
                comment: commentId,
            }
        ]
    })

    if(likedComment){
        const unlikeComment = await Like.findByIdAndDelete(likedComment._id);

        if(! unlikeComment){
            throw new ApiError(500,'something went wrong while unliking the comment')
        }

        return res
        .status(200)
        .json(new ApiResponse (
            200,
            'comment unliked successfully',
            unlikeComment,
        ))
    }

    if(!likedComment){
        const likeComment = await Like.create(
            {
                user:req.user?._id,
                comment:commentId,
            }
        )

        if(!likeComment){
            throw new ApiError(500,'something went wrong while liking the comment')
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            'comment liked successfully',
            likeComment
        ))
    }
    
})

const toggleTweetLike = asyncHandlerPromise(async (req,res) => {
    const {tweetId} = req.params;

    const likedTweet = await Like.findOne({
        $and:[
            {
                user: req.user?._id
            },
            {
                tweet: tweetId,
            }
        ]
    })

    if(likedTweet){
        const unliketweet = await Like.findByIdAndDelete(likedtweet._id);

        if(! unliketweet){
            throw new ApiError(500,'something went wrong while unliking the tweet')
        }

        return res
        .status(200)
        .json(new ApiResponse (
            200,
            'tweet unliked successfully',
            unliketweet,
        ))
    }

    if(!likedTweet){
        const liketweet = await Like.create(
            {
                user:req.user?._id,
                tweet:tweetId,
            }
        )

        if(!liketweet){
            throw new ApiError(500,'something went wrong while liking the tweet')
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            'tweet liked successfully',
            liketweet
        ))
    }
    
})

const getAllLikedVideos = asyncHandlerPromise(async (req,res) => {
    
    const likedVideos = await Like.aggregate([
        {
            $match: {
                user: req.user?._id
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'allLikedVideos',
                foreignField:'_id',
                as:'allLikedVideos',
                pipeline:[
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
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:'$owner'
                            }
                        }
                    },
                    {
                        $project:{
                            thumbnail:1,
                            videoFile:1,
                            owner:1
                        }
                    }
                ]
            }
        },
    ])

    if(!likedVideos){
        throw new ApiError(500,'something went wrong while fetching liked videos')
    }

    return res
    .status(200)
    .json(new ApiResponse(200,
        'all liked videos fetched ',
        likedVideos
    ))
})

export {toggelVideoLike,toggleCommentLike,toggleTweetLike,getAllLikedVideos}