import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addVideo, createPlaylist, getUserPlayList, removePlaylist, removeVideo } from "../controllers/playlist.controller.js";


const router = Router();

router.use(verifyJwt)

router.route('/createPlayList').post(createPlaylist);
router.route('/all-playlists').get(getUserPlayList);
router.route('/add-video').patch(addVideo);
router.route('/removevideo/:videoId/:playlistId').patch(removeVideo);
router.route('/remove-playlist/:playlistID').delete(removePlaylist)



export default router;