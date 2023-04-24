const JWT = require("jsonwebtoken");
const { connection } = require("../config")
const httpStatus = require("http-status");


const provideAccessToken = (data) => {
    return JWT.sign(
        data,
        "KEY_ACCESS_TOKEN",
        {
            expiresIn: "200s",
        }
    );
}

const provideRefreshToken = async (id) => {
    let [data] = await connection.promise().query("SELECT fullname, id, role, auth, phone FROM users WHERE id= ?", [id])
    data = data[0];
    return JWT.sign(
        data,
        "KEY_REFRESH_TOKEN",
        {
            expiresIn: "2000s",
        }
    );
}

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            res.status(httpStatus.UNAUTHORIZED).json({error: true, content: "You need authorization."});
        }
        const decoded = JWT.verify(token, "KEY_ACCESS_TOKEN");
        req.id = decoded.id;
        req.role = decoded.role;
        req.auth = decoded.auth;
        next();
    } catch {
        res.status(httpStatus.UNAUTHORIZED).json({ error: true, content: "Something is wrong."});
    }
};

module.exports = {
    provideAccessToken,
    provideRefreshToken,
    verifyToken
}