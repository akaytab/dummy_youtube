import { Router } from "express";
import { changePassword, getCurrentUser, getWatchHistory, incomingRefreshToken, loginUser, logOutUser, registerUser, updateUser, updateUserAvatar, updateUserCoverImg, userChannel } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router =Router();
router.route('/register').post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    registerUser)

router.route('/login').post(loginUser)


//secured routes
router.route('/logout').post(verifyJwt, logOutUser);
router.route('/refresh-token').post(incomingRefreshToken);
router.route('/change-password').post(verifyJwt,changePassword);
router.route('/current-user').get(verifyJwt,getCurrentUser);
router.route('/update-details').patch(verifyJwt,updateUser);
router.route('/avatar').patch(verifyJwt,upload.single('avatar'),updateUserAvatar);
router.route('/coverimage').patch(verifyJwt,upload.single('coverImage'),updateUserCoverImg);
router.route('/c/:username').get(verifyJwt, userChannel);
router.route('/history').get(verifyJwt,getWatchHistory);



export default router;