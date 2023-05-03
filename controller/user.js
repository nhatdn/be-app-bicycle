const { connection } = require("../config")
const HttpStatus = require("http-status");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");
const CODE_MSG = require("../constants/codeMSG");
const moment = require("moment");

const avatar = PromiseFC(async (req, res, next) => {
    try {
        console.log(req.files);
        const file = req?.files?.['avatar']?.[0];
        const id = req.id;
        if(!file) {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: "Vui lòng upload ảnh đại diện!." });
        } else  {
            let path = file.destination + file.filename; 
            path = path.substring(1);
            await connection.promise().execute("UPDATE users SET avatar = ? WHERE id = ?", [path, id]);
            return res.status(HttpStatus.OK).json({ data: CODE_MSG.UPDATE_AVATAR_SUCCESS, avatar: path });
        }
    } catch(e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const changeProfile = PromiseFC(async (req, res, next) => {
    try {
        const id = req.id;
        const fullname = req.body?.fullname?.trim();
        const birthday = req.body?.birthday?.trim();
        const address = req.body?.address?.trim();
        if (fullname) {
            await connection.promise().execute("UPDATE users SET fullname = ? WHERE id = ?", [fullname, id]);
        }
        if (moment(birthday, "YYYY-MM-DD", true).isValid()) {
            await connection.promise().execute("UPDATE users SET birthday = ? WHERE id = ?", [birthday, id]);
        } else {
            res.status(HttpStatus.OK).json({ data: CODE_MSG.DATA_BIRTHDAY_IS_INCORRECT });
        }
        if (address) {
            await connection.promise().execute("UPDATE users SET address = ? WHERE id = ?", [address, id]);
        }
        res.status(HttpStatus.OK).json({ data: CODE_MSG.UPDATE_PROFILE_SUCCESS });
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const profile = PromiseFC(async (req, res, next) => {
    try {
        const id = req.id;
        const [[data]] = await connection.promise().query("SELECT * FROM users WHERE id = ?", [id]);
        if(data) {
            delete data.password;
            delete data.auth;
            res.status(HttpStatus.OK).json({ data });
        } else {
            res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.USERNAME_IS_NOT_EXISTED });
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const changePassword = PromiseFC(async (req, res, next) => {
    try {
        const id = req.id;
        const password = req.body?.password?.trim();
        const newPassword = req.body?.newPassword?.trim();
        if(password == newPassword) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.SAME_PASSWORDS });
        }
        if(!password || !newPassword) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.LACK_DATA });
            return;
        }
        const [[data]] = await connection.promise().query("SELECT * FROM users WHERE id = ?", [id]);
        if(data?.password == md5(password)) {
            if(newPassword.length < 8) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.PASSWORD_LENGTH_MUST_EIGHT_CHARS });
            } else {
                await connection.promise().execute("UPDATE users SET password = ? WHERE id = ?", [md5(newPassword), id]);
                res.status(HttpStatus.OK).json({ data: CODE_MSG.CHANGE_PASSWORD_SUCCESS });
            }
        } else {
            res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.PASSWORD_IS_INCORRECT });
            return;
        }
    }  catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

module.exports = {
    avatar,
    changeProfile,
    profile,
    changePassword
}