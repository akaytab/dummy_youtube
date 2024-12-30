import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
    video:{
        type: Schema.Types.ObjectId,
        ref:'Video'
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref:'Comment'
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref:'Tweet',
    },
    user:{
        type: Schema.Types.ObjectId,
        ref:'User',
    },
    allLikedVideos:[
        {
            type: Schema.Types.ObjectId,
            ref:'Video'
        }
    ]
},
{
    timestamps:true,
})

export const Like = mongoose.model('Like',likeSchema);