import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandlerPromise } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Playlist } from "../model/playlist.model.js";


// const removeCircularReferences = (obj) => {
//     const seen = new WeakSet();
//     return JSON.parse(JSON.stringify(obj, (key, value) => {
//         if (typeof value === 'object' && value !== null) {
//             if (seen.has(value)) {
//                 return;
//             }
//             seen.add(value);
//         }
//         return value;
//     }));
// };


const createPlaylist = asyncHandlerPromise(async (req,res) => {

    /**
     * --> request name and description from body 
     * --> return playlist
     */
    
    const{name,description} = req.body;

    if([name,description].some((field)=>field?.trim()==='')){
        throw new ApiError(400,`name or description fields are missing from playlist body`);
    }

    const existedPlaylist =await Playlist.findOne({name:req.body.name})
    if(existedPlaylist){
        throw new ApiError(409,'playlist already existed')
    }

    const playList = await Playlist.create({
        name,
        description, 
        owner: req.user?._id
    })

    if(!playList){
        throw new ApiError(500, 'Someyhing went wrong while creating playlist')
    }

    return res
    .status(200)
    .json(new ApiResponse(200,'Playlist created Successfully',playList))

})

const getUserPlayList = asyncHandlerPromise (async (req,res) => {
    const  userId  = req.user._id;
    /** 
     * --> validate User Id is correct or not 
     * --> fetch all playlist of the user
     */

    if(!isValidObjectId(userId)){
        throw new ApiError(400, 'No playlist matched this userID found')
    }

    const allPlayLists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'videos',
                foreignField:'_id',
                as:'videos',
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
                                        avatar:1,
                                    }
                                }
                            ]

                        }
                    }
                ]
            }
        },
        {
            $project:{
                name:1,
                description:1,
                videos:1

            }
        }
    ])

    if(!allPlayLists){
        throw new ApiError(401,'no playlist found')
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        'All playLists fetched successfully',
        allPlayLists
    ))   
})

const addVideo = asyncHandlerPromise(async (req,res) => {
    const {name,videoId} = req.body;

    if(!(name || videoId)){
        throw new ApiError(400,'name and videoId field is required')
    }

    const myPlaylist = await Playlist.findOne({name: req.body.name });

    if(!myPlaylist){
        throw new ApiError(400,'playlist dosenot exist')
    }

    if (! myPlaylist.videos.videoId){
        throw new ApiError(429,'video already exist in playlist')
    }

    myPlaylist.videos.push(videoId);
    await myPlaylist.save();

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(myPlaylist._id)
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'videos',
                foreignField:'_id',
                as:'videos',
                pipeline:[{
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
                                    avatar:1,
                                }
                            }
                        ]
                    }
                }]
            }
        },
        {
            $project:{
                name:1,
                description:1,
                videos:1,
            }
        }

    ])
    return res
    .status(200).json(new ApiResponse(200,'video Successfully Added',playlist))
    
})

const removeVideo = asyncHandlerPromise(async(req,res)=>{
    const{videoId, playlistId} = req.params;

    if(! isValidObjectId(playlistId) && ! isValidObjectId(videoId)){
        throw new ApiError(401,'videoId or plaiList Id is not valid ID');
    }

    const playlist = await Playlist.findById(playlistId);
    
    if(!playlist){
        throw new ApiError(400,'cannot fount the playlist with given Id')
    }

    if(! playlist.videos.includes(videoId)){
        throw new ApiError(400,'video dosenot exist in playlist');
    }

    const removedVideo=await Playlist.findByIdAndUpdate(playlist,
        {
            $pull:{
                videos: {
                    $in:videoId,
                }
            }
        },{
            new:true,
        }
    )
    return res
    .status(200)
    .json(new ApiResponse(200,'video successfully deleted',removedVideo))
})

const removePlaylist = asyncHandlerPromise(async (req,res) => {
    const {playlistID} = req.params;

    if(!isValidObjectId(playlistID)){
        throw new ApiError(400,'invalid playlist Id to be removed')
    }
    const playlistToBeDeleted = Playlist.findById(playlistID);
    if(!playlistToBeDeleted){
        throw new ApiError(400,'playlist cannot be found')
    }

    const removePlaylist=await Playlist.findOneAndDelete(playlistToBeDeleted);
    
    if(! removePlaylist) {
        throw new ApiError(500,'something went wrong while deleting playlist')
    }
    // const safePlaylist = removeCircularReferences(removePlaylist);

    return res 
    .status(200).json(new ApiResponse(200,'playlist deleted successfully',removePlaylist))
})

export {createPlaylist,getUserPlayList,addVideo,removeVideo,removePlaylist}

