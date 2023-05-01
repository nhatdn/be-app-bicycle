const { Router } = require("express");
const { register, verify, login, logout, forgot, token, newPassword } = require("../controller/auth");
const { verifyToken } = require("../utils/token");
const router = Router();

router.post("/register", register);
router.post("/verify", verify);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/forgot", forgot);
router.post("/token", token);
router.post("/new-password", newPassword);

module.exports = router;