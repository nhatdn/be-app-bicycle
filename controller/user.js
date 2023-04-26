const { connection } = require("../config")
const HttpStatus = require("http-status");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");

const avatar = PromiseFC(async (req, res, next) => {
    try {
        const file = req?.files['avatar']?.[0];
        const id = req.id;
        if(!file) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Vui lòng upload ảnh đại diện!." });
        } else  {
            const path = file.destination + file.filename; 
            await connection.promise().execute("UPDATE users SET avatar = ? WHERE id = ?", [path, id]);
            res.status(HttpStatus.OK).json({ data: "Cập nhật ảnh đại diện thành công!" });
        }
    } catch(e) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const changeProfile = PromiseFC(async (req, res, next) => {
    try {
        const id = req.id;
        const fullname = req.body.fullname;
        const birthday = req.body.birthday;
        const address = req.body.address;
        if (fullname) {
            await connection.promise().execute("UPDATE users SET fullname = ? WHERE id = ?", [fullname, id]);
        }
        if (birthday) {
            await connection.promise().execute("UPDATE users SET birthday = ? WHERE id = ?", [birthday, id]);
        }
        if (address) {
            await connection.promise().execute("UPDATE users SET address = ? WHERE id = ?", [address, id]);
        }
        res.status(HttpStatus.OK).json({ data: "Cập nhật thành công" });
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
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
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Không tìm thấy người dùng" });
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const changePassword = PromiseFC(async (req, res, next) => {
    try {
        const id = req.id;
        const password = req.body?.password?.trim();
        const newPassword = req.body?.newPassword?.trim();
        if(!password || !newPassword) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Thiếu dữ liệu" });
            return;
        }
        const [[data]] = await connection.promise().query("SELECT * FROM users WHERE id = ?", [id]);
        if(data?.password == md5(password)) {
            if(newPassword.length < 8) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: "Mật khẩu mới phải trên 8 ký tự" });
            } else {
                await connection.promise().execute("UPDATE users SET password = ? WHERE id = ?", [md5(newPassword), id]);
                res.status(HttpStatus.OK).json({ data: "Đổi mật khẩu thành công!" });
            }
        } else {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Mật khẩu hiện tại của bạn không đúng" });
            return;
        }
    }  catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

module.exports = {
    avatar,
    changeProfile,
    profile,
    changePassword
}