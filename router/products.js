const { Router } = require("express");
const { postProducts } = require("../controller/products");
const { verifyToken } = require("../utils/token");
const router = Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-'  + Math.random() + '-' + file.originalname);
    }
});
const upload = multer({ storage });
const cpUpload = upload.fields([{ name: 'covers', maxCount: 4 }])

router.post("/post-products", verifyToken, cpUpload, postProducts);



module.exports = router;