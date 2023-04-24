const JWT = require("jsonwebtoken");
const { connection } = require("../config")


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

module.exports = {
    provideAccessToken,
    provideRefreshToken
}