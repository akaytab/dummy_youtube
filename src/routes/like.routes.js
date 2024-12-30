import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { getAllLikedVideos, toggelVideoLike, toggleCommentLike, toggleTweetLike } from "../controllers/like.controller";


const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggelVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getAllLikedVideos);

export default router
