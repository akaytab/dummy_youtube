//using try catch
const asyncHandlerTC =(fn)=>async(req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(error.code||500).json({
            success:false,
            message:error.message,
        })  
    }
}

//using promise
const asyncHandlerPromise =(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandlerPromise};