const { connection } = require("../config")
const HttpStatus = require("http-status");
const { TWILO } = require("../config");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");
const httpStatus = require("http-status");
const twilio = require("twilio")(TWILO.sid, TWILO.authToken);

const {
    provideAccessToken,
    provideRefreshToken
} = require("../utils/token");

const sendSMS = (phone, code) => {
    return twilio.messages
        .create({
            from: "+16205099708",
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
    if(!phone || !fullname || !address || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({error: "Thiếu dữ liệu"});
    }
    try {
        //check account is exist
        const [data] = await connection.promise().query("SELECT * FROM users where phone = ?", [phone]);
        if (data?.length) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Tên tài khoản hoặc số điện thoại của bạn đã được sử dụng, vui lòng thử lại!" });
        } else {
            const code = randomSixDigitNumber();
            await sendSMS(phone, code);
            await connection.promise().execute("INSERT INTO users (fullname, phone, address, password, auth) VALUE (? , ? , ? , ?, ?)", [fullname, phone, address, md5(password), code.toString()]);
            res.status(HttpStatus.OK).json({ result: "Chúng tôi đã gửi mã xác thực của bạn tới số điện thoại" + phone + ". Xin vui lòng kiểm tra trong hòm thư tin nhắn!." });
        }
    } catch (e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
});


const verify = PromiseFC(async (req, res, next) => {
    const code = req.body.code;
    let phone = req.body.phone;
    
    if(!code || !phone) {
        res.status(httpStatus.BAD_REQUEST).json({
            error: "Thiếu dữ liệu"
        })
    }
    try {
        let [data] = await connection.promise().query("SELECT auth FROM users WHERE phone= ?", [phone])
        data = data[0];
        if(data?.auth == code) {
            await connection.promise().execute("UPDATE users SET auth=1 WHERE phone = ?", [phone]);
            res.status(HttpStatus.OK).json({ result: "Xác thực thành công, vui lòng quay lại trang login để đăng nhập!" });
        } else if (data?.auth == 1 || data?.auth == 2) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: "Tài khoản này đã được xác thực và sử dụng!" });
        } else if(data?.auth != code) {
            res.status(httpStatus.BAD_REQUEST).json({ error: "Mã xác thực không đúng, vui lòng thử lại!" })
        } else {
            res.status(httpStatus.BAD_REQUEST).json({ error: "Đã có lỗi gì đó xãy ra, vui lòng thử lại!" })
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const login = PromiseFC(async (req, res, next) =>  {
    try {
        let phone = req.body.phone;
        let password = req.body.password;
        if(!password || !phone) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
        }
        password = md5(password);
        let [data] = await connection.promise().query("SELECT * FROM users WHERE phone = ? AND password = ?", [phone, password]);
        console.log(phone);
        console.log(password);
        console.log("--------------");
        console.log(data);

        if(data.length) {
            data = data[0];

            if(data?.auth == 2) {
                res.status(httpStatus.BAD_REQUEST).json({ error: "Tài khoản của bạn đã được đăng nhập!" })
            } else if(data.auth != 1) {
                res.status(httpStatus.BAD_REQUEST).json({ error: "Tài khoản của bạn chưa được xác thực số điện thoại!" })
            } else {
                // user đã đăng nhập
                await connection.promise().execute("UPDATE users SET auth = 2 WHERE phone= ?", [phone]);
                const accessToken = provideAccessToken({
                    id: data.id,
                    role: data.role,
                    auth: data.auth,
                })
                delete data.password;
                const refreshToken = await provideRefreshToken(data.id);
                res.status(httpStatus.OK).json({ data, accessToken, refreshToken })
            }
        } else {
            res.status(httpStatus.BAD_REQUEST).json({ error: "Tài khoản hoặc mật khẩu không đúng, vui lòng thử lại!" })
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const logout = PromiseFC(async (req, res, next) => {
    try {
        const id = req.body.id;
        if(!id) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
        }
        await connection.promise().execute("UPDATE users SET auth=1 WHERE id = ?", [id]);
        res.status(httpStatus.OK).json({ data: "Đăng xuất thành công" })
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: e });
    }
})

const forgot = PromiseFC(async (req, res, next) => {
    try {
        const phone = req.body.phone;
        if(!phone) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: "Thiếu dữ liệu"
            })
        }
        const [data] = await connection.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);
        if(data.length) {
            const code = randomSixDigitNumber();
            await connection.promise().execute("UPDATE users SET auth= ? WHERE phone = ?", [code, phone]);
            await sendSMS(phone, code);
            res.status(httpStatus.OK).json({ data: "Đăng xuất thành công" })
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
            res.status(401).json({error: true, content: "You need authorization."});
        }
        const decoded = JWT.verify(token, "KEY_ACCESS_TOKEN");
        const newAccessToken = provideAccessToken({
            id: data.id,
            role: data.role,
            auth: data.auth,
        })   
        next();
    } catch {
        res.status(401).json({ error: true});
    }
})

module.exports = {
    register,
    verify,
    login,
    logout,
    forgot,
    token
}