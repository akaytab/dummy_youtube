import mongoose from "mongoose";
import dotenv from 'dotenv';
import { DB_NAME } from "../constants.js";

dotenv.config();
const  connectDB = async ()=>{
    try {       
       const connect= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`MONGO DB CONNECTED  ${connect.connection.host}`);
       
    } catch (error) {
        console.log("ERROR",error);
        process.exit(1);
    }
}

export default connectDB