import { asyncHandlerPromise } from "../utils/asyncHandler.js";

const registerUser= asyncHandlerPromise(async (req,res) => {
    res.status(200).json({
        message:'ok'
    })  
})

export {registerUser}