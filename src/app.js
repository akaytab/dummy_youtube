import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app =express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credential:true,
}))

app.use(express.json({limit:'20kb',}));
app.use(express.urlencoded({extended:true, limit:'20kb'}));
app.use(express.static('public'));
app.use(cookieParser());

// app.use((req, res, next) => {
//     console.log(`Request URL: ${req.url}`);
//     console.log(`Request Method: ${req.method}`);
//     console.log(`Request Headers: ${JSON.stringify(req.headers.authorization)}`);
//     console.log(`Request Cookies: ${JSON.stringify(req.cookies)}`);
//     console.log(`Request Body: ${JSON.stringify(req.body)}`);
//     next();
// });




// routes import
import userRoute from './routes/user.routes.js'
import playlistRoute from './routes/playlist.routes.js';
// import tweetRouter from "./routes/tweet.routes.js"
// import subscriptionRouter from "./routes/subscription.routes.js"
import videoRoute from "./routes/video.routes.js"
import commentRoute from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
// import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
app.use('/api/v1/users',userRoute);
app.use('/api/v1/playlist',playlistRoute);
// app.use("/api/v1/healthcheck", healthcheckRouter)
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos",videoRoute );
app.use("/api/v1/comments",commentRoute);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
// app.use("/api/v1/dashboard", dashboardRouter)


export {app};