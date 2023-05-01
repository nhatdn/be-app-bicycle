const JWT = require("jsonwebtoken");
const { connection, JWT_KEY } = require("../config")
const httpStatus = require("http-status");


const provideAccessToken = (data) => {
    return JWT.sign(
        data,
        JWT_KEY.KEY_ACCESS_TOKEN,
        {
            expiresIn: "1h",
        }
    );
}

const provideRefreshToken = async (id) => {
    let [[data]] = await connection.promise().query("SELECT fullname, id, role, code, idDevice, phone FROM users WHERE id= ?", [id])
    return JWT.sign(
        data,
        JWT_KEY.KEY_REFRESH_TOKEN,
        {
            expiresIn: "10000h",
        }
    );
}

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            res.status(httpStatus.UNAUTHORIZED).json({ error: true, content: "Bạn cần cấp token." });
        }
        const decoded = JWT.verify(token, JWT_KEY.KEY_ACCESS_TOKEN);
        req.id = decoded.id;
        req.role = decoded.role;
        req.auth = decoded.auth;
        next();
    } catch {
        res.status(httpStatus.UNAUTHORIZED).json({ error: true, content: "Token của bạn đã hết hạn." });
    }
};

module.exports = {
    provideAccessToken,
    provideRefreshToken,
    verifyToken
}