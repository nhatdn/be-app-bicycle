const { avatar, changeProfile, profile, changePassword } = require("../controller/user");
const multer = require('multer');
const { Router } = require("express");
const { verifyToken } = require("../utils/token");
const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-'  + Math.random() + '-' + file.originalname);
    }
});
const upload = multer({ storage });
const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }])

router.post("/upload-avatar", verifyToken, cpUpload, avatar);
router.post("/change-profile", verifyToken, changeProfile);
router.get("/profile", verifyToken, profile);
router.post("/change-password", verifyToken, changePassword);


module.exports = router;