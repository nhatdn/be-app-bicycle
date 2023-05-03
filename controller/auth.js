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
const CODE_MSG = require("../constants/codeMSG");
const {
    provideAccessToken,
    provideRefreshToken
} = require("../utils/token");

const sendSMS = (phone, code) => {
    return;
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
    if (!phone || !fullname || !address || !password || !idDevice) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.LACK_DATA });
    }
    try {
        const [[data]] = await connection.promise().query("SELECT * FROM users where phone = ?", [phone]);
        if (data) {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.ACCOUNT_IS_EXISTED });
        } else {
            const code = randomSixDigitNumber();
            await sendSMS(phone, code);
            await connection.promise().execute("INSERT INTO users (fullname, phone, address, password, code, idDevice) VALUE (? , ? , ? , ?, ?, ?)", [fullname, phone, address, md5(password), code.toString(), idDevice]);
            return res.status(HttpStatus.OK).json({ data: CODE_MSG.SEND_SMS_SUCCESS });
        }
    } catch (e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
});


const verify = PromiseFC(async (req, res, next) => {
    const code = req.body.code;
    let phone = req.body.phone;
    let idDevice = req.query.idDevice;
    if (!code || !phone) {
        res.status(httpStatus.BAD_REQUEST).json({
            error: CODE_MSG.LACK_DATA
        })
    }
    try {
        let [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone])
        if (!data) {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.USERNAME_IS_NOT_EXISTED });
        }
        if (data.code == code && data.code != null) {
            if (data.status == STATUS.FORGOT_PASS) {
                const uuid = UUID();
                console.log({
                    status: STATUS.AUTHENTICATED_CODE, idDevice, uuid, phone
                });
                await connection.promise().execute("UPDATE users SET code = NULL, status = ?, idDevice = ?, uuid = ? WHERE phone = ?", [STATUS.AUTHENTICATED_CODE, idDevice, uuid, phone]);
                return res.status(HttpStatus.OK).json({ data: CODE_MSG.AUTH_FORGOT_PASSWORD_SUCCESS , uuid });
            }
            else if (data.status == STATUS.NOT_AUTH) {
                await connection.promise().execute("UPDATE users SET code= NULL, status=? WHERE phone = ?", [STATUS.LOGOUT, phone]);
                return res.status(HttpStatus.OK).json({ data: CODE_MSG.AUTH_SUCCESS });
            }
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ data: CODE_MSG.CODE_IS_INCORRECT });
        }
    } catch (e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const login = PromiseFC(async (req, res, next) => {
    let idDevice = req.query.idDevice;
    try {
        let phone = req.body.phone;
        let password = req.body.password;
        if (!password || !phone) {
            return res.status(httpStatus.BAD_REQUEST).json({
                error: CODE_MSG.LACK_DATA
            })
        }
        password = md5(password);
        let [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);
        if (data) {

            if (data.password === password) {
                const status = data.status;
                console.log(STATUS.LOGIN);
                if (data.status = STATUS.NOT_AUTH || data.code != null) {
                    res.status(httpStatus.BAD_REQUEST).json({ error: CODE_MSG.ACCOUNT_IS_NOT_AUTH });
                    return;
                } 
                if (status == STATUS.LOGIN) {
                    res.status(httpStatus.BAD_REQUEST).json({ error: CODE_MSG.ACCOUNT_LOGINED });
                    return;
                } else {
                    await connection.promise().execute("UPDATE users SET status = ?, idDevice = ? WHERE phone= ?", [STATUS.LOGIN, idDevice, phone]);
                    const accessToken = provideAccessToken({
                        id: data.id,
                        role: data.role,
                        auth: data.auth,
                        phone: data.phone,
                        idDevice,
                    })
                    delete data.password;
                    delete data.status;
                    delete data.code;
                    delete data.uuid;
                    const refreshToken = await provideRefreshToken(data.id);
                    return res.status(httpStatus.OK).json({ data, accessToken, refreshToken })
                }
            } else {
                return res.status(httpStatus.BAD_REQUEST).json({ error: CODE_MSG.ACCOUNT_IS_INCORRECT })
            }
        } else {
            return res.status(httpStatus.BAD_REQUEST).json({ error: CODE_MSG.ACCOUNT_IS_NOT_REGISTER })
        }
    } catch (e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const logout = PromiseFC(async (req, res, next) => {
    try {
        const phone = req.phone;
        console.log(phone);
        if(!phone) {
            return res.status(httpStatus.BAD_REQUEST).json({ error: CODE_MSG.ERROR_TOKEN })
        }
        await connection.promise().execute("UPDATE users SET status = ? WHERE phone = ?", [STATUS.LOGOUT, phone]);
        return res.status(httpStatus.OK).json({ data: CODE_MSG.LOGOUT_SUCCESS })
    } catch (e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const forgot = PromiseFC(async (req, res, next) => {
    try {
        let idDevice = req.query.idDevice;
        let phone = req.body.phone;
        if (!phone || !idDevice) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
            return;
        }

        const [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);

        if (data) {
            const code = randomSixDigitNumber();
            await connection.promise().execute("UPDATE users SET code= ?, status = ?, idDevice = ? WHERE phone = ?", [code, STATUS.FORGOT_PASS, idDevice, phone]);
            await sendSMS(phone, code);
            phone = phone.replace("+84", "0");
            return res.status(httpStatus.OK).json({ data: CODE_MSG.SEND_SMS_SUCCESS });
        } else {
            return res.status(httpStatus.BAD_REQUEST).json({
                error: CODE_MSG.USERNAME_IS_INCORRECT
            })
        }
    } catch (e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const token = PromiseFC(async (req, res, next) => {
    try {
        const token = req.body.refreshToken;
        if (!token) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.NOT_REFRESH_TOKEN });
        }
        const decoded = JWT.verify(token, JWT_KEY.KEY_REFRESH_TOKEN);
        let [[data]] = await connection.promise().query("SELECT * FROM users WHERE id = ?", [decoded.id]);
        if (data) {
            if (data?.status == STATUS.LOGIN) {
                const accessToken = provideAccessToken({
                    id: data.id,
                    role: data.role,
                    auth: data.auth,
                    phone: data.phone,
                })
                return res.status(HttpStatus.OK).json({ accessToken });
            } else {
                return res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.ACCOUNT_LOGOUTED });
            }
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: CODE_MSG.SESSION_IS_INCORRECT });
        }
    } catch (e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const newPassword = PromiseFC(async (req, res, next) => {
    try {
        let idDevice = req.query.idDevice;
        let phone = req.body.phone;
        let password = req.body.password;
        let uuid = req.body.uuid;
        if (!uuid || !password || !phone || !idDevice) {
            return res.status(httpStatus.BAD_REQUEST).json({
                error: CODE_MSG.LACK_DATA
            })
        }
        const [[data]] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);
        if (data.uuid == uuid && data.idDevice == idDevice) {
            await connection.promise().execute("UPDATE users SET password = ? WHERE phone = ?", [md5(password), phone]);
            return res.status(httpStatus.OK).json({ data: CODE_MSG.UPDATE_PASSWORD_SUCCESS });
        } else {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.DIFF_DEVICE });
        }
    } catch {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
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