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

//routes declaration
app.use('/api/v1/users',userRoute);

export {app};