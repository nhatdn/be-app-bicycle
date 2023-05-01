const { connection, JWT_KEY } = require("../config");
const JWT = require("jsonwebtoken");
const HttpStatus = require("http-status");
const { TWILO } = require("../config");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");
const httpStatus = require("http-status");
const twilio = require("twilio")(TWILO.sid, TWILO.authToken);
const { STATUS } = require("../constants");
const UUID = require("../utils/uuid");
const {
    provideAccessToken,
    provideRefreshToken
} = require("../utils/token");

const sendSMS = (phone, code) => {
    return twilio.messages
        .create({
            from: "+16203492138",
            to: phone,
            body: "Đây là mã xác thực tài khoản App Xe Đạp Vương: " + code,
        })
}
function randomSixDigitNumber() {
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
}

const register = PromiseFC(async (req, res, next) => {
    let phone = req.body.phone;
    let fullname = req.body.fullname;
    let address = req.body.address;
    let password = req.body.password;
    let idDevice = req.query.idDevice;
    if(!phone || !fullname || !address || !password || !idDevice) {
        return res.status(HttpStatus.BAD_REQUEST).json({error: "Thiếu dữ liệu"});
    }
    try {
        const [[data]] = await connection.promise().query("SELECT * FROM users where phone = ?", [phone]);
        if (data) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Tên tài khoản hoặc số điện thoại của bạn đã được sử dụng, vui lòng thử lại!" });
        } else {
            const code = randomSixDigitNumber();
            await sendSMS(phone, code);
            await connection.promise().execute("INSERT INTO users (fullname, phone, address, password, code, idDevice) VALUE (? , ? , ? , ?, ?, ?)", [fullname, phone, address, md5(password), code.toString(), idDevice]);
            phone = phone.replace("+84", "0");
            res.status(HttpStatus.OK).json({ result: "Chúng tôi đã gửi mã xác thực của bạn tới số điện thoại " + phone + ". Xin vui lòng kiểm tra trong hòm thư tin nhắn!." });
        }
    } catch (e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
});


const verify = PromiseFC(async (req, res, next) => {
    const code = req.body.code;
    let phone = req.body.phone;
    let idDevice = req.body.idDevice;
    if(!code || !phone) {
        res.status(httpStatus.BAD_REQUEST).json({
            error: "Thiếu dữ liệu"
        })
    }
    try {
        let [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone= ?", [phone])
        if(!data) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Tài khoản không tồn tại" });
        }
        if(data.code == code && data.code != null && data.status == STATUS.FORGOT_PASS) {
            const uuid = UUID();
            await connection.promise().execute("UPDATE users SET code = NULL, status = ?, idDevice = ? WHERE phone = ?", [STATUS.AUTHENTICATED_CODE, `${data.idDevice}-${uuid}`, phone]);
            res.status(HttpStatus.OK).json({ result: "Xác thực thành công, vui lòng nhập mật khẩu mới!", uuid });
        } else {
            await connection.promise().execute("UPDATE users SET code=NULL, status=? WHERE phone = ?", [STATUS.LOGOUT, phone]);
            res.status(HttpStatus.OK).json({ result: "Xác thực thành công, vui lòng quay lại trang login để đăng nhập!" });
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const login = PromiseFC(async (req, res, next) =>  {
    let idDevice = req.query.idDevice;
    try {
        let phone = req.body.phone;
        let password = req.body.password;
        if(!password || !phone) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
        }
        password = md5(password);
        let [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);
        if(data) {
            if(data.password == md5(password)) {
                if(data.status == STATUS.LOGIN) {
                    res.status(httpStatus.BAD_REQUEST).json({ error: "Tài khoản của bạn đã được đăng nhập!" })
                } else if(data.status = 0 && data.code != NULL) {
                    res.status(httpStatus.BAD_REQUEST).json({ error: "Tài khoản của bạn chưa được xác thực số điện thoại!" })
                } else {
                    await connection.promise().execute("UPDATE users SET status = ?, idDevice = ? WHERE phone= ?", [STATUS.LOGIN, idDevice, phone]);
                    const accessToken = provideAccessToken({
                        id: data.id,
                        role: data.role,
                        auth: data.auth,
                        idDevice,
                    })
                    delete data.password;
                    delete data.status;
                    delete data.code;
                    const refreshToken = await provideRefreshToken(data.id);
                    res.status(httpStatus.OK).json({ data, accessToken, refreshToken })
                }
            } else {
                res.status(httpStatus.BAD_REQUEST).json({ error: "Tài khoản hoặc mật khẩu không đúng, vui lòng thử lại!" })
            }
        } else {
            res.status(httpStatus.BAD_REQUEST).json({ error: "Tài khoản này chưa được đăng ký!" })
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const logout = PromiseFC(async (req, res, next) => {
    try {
        const id = req.id;
        if(!id) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
        }
        await connection.promise().execute("UPDATE users SET status = ? WHERE id = ?", [STATUS.LOGOUT, id]);
        res.status(httpStatus.OK).json({ data: "Đăng xuất thành công" })
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const forgot = PromiseFC(async (req, res, next) => {
    try {
        let idDevice = req.query.idDevice;
        let phone = req.body.phone;
        if(!phone || !idDevice) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
            return;
        }
        
        const [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);
      
        if(data) {
            const code = randomSixDigitNumber();
            await connection.promise().execute("UPDATE users SET code= ?, status = ?, idDevice = ? WHERE phone = ?", [code, STATUS.FORGOT_PASS, idDevice, phone]);
            await sendSMS(phone, code);
            phone = phone.replace("+84", "0");
            res.status(httpStatus.OK).json({ data: "Đã gửi mã xác thực tới số điện thoại " + phone + ". Xin vui lòng kiểm tra tin nhắn!." });
        } else {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Số điện thoại của bạn không đúng!"
            })
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const token = PromiseFC(async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            res.status(HttpStatus.BAD_REQUEST).json({error: true, content: "You need authorization."});
        }
        const decoded = JWT.verify(token, JWT_KEY.KEY_REFRESH_TOKEN);
        let [[data]] = await connection.promise().query("SELECT * FROM users WHERE id = ?", [decoded.id]);
        if(data.status == STATUS.LOGIN) {
            const accessToken = provideAccessToken({
                id: data.id,
                role: data.role,
                auth: data.auth,
            })   
            res.status(HttpStatus.OK).json({ accessToken });
        } else {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Tài khoản này đã đăng suất"});
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.BAD_REQUEST).json({ error:  "Tài khoản này đã đăng suất hoặc mã xác thực phiên không đúng"});
    }
})

const newPassword = PromiseFC(async (req, res, next) => {
    try {
        let idDevice = req.query.idDevice;
        let phone = req.body.phone;
        let password = req.body.password;
        let uuid = req.body.uuid;
        if(!uuid || !password || !phone || !idDevice) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
            return;
        }
        const [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);
        if(data.idDevice.includes(uuid) && data.idDevice.includes(idDevice)) {
            await connection.promise().execute("UPDATE users SET password = ? WHERE phone = ?", [md5(password), phone]);
            res.status(httpStatus.OK).json({ data: "Cập nhật mật khẩu thành công, quay lại trang login để tiếp tục!." });
        } else {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Không thể cập nhật mật khẩu vì không đúng thiết bị gửi yêu cầu cấp cấp mật khẩu mới." });
        }
    } catch {
        console.log(e);
        res.status(HttpStatus.BAD_REQUEST).json({ error:  "Tài khoản này đã đăng suất hoặc mã xác thực phiên không đúng"});
    }
})

module.exports = {
    register,
    verify,
    login,
    logout,
    forgot,
    token,
    newPassword
}