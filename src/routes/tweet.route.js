import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";


const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router