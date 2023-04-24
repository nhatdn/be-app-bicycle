const { Router } = require("express");
const { register, verify, login, logout, forgot } = require("../controller/auth");
const router = Router();

router.post("/register", register);
router.post("/verify", verify);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot", forgot);

module.exports = router;