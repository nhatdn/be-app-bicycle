const { connection } = require("./database")
const sid = process.env.TWILO_SID;
const authToken = process.env.TWILO_TOKEN;
const KEY_ACCESS_TOKEN = process.env.KEY_ACCESS_TOKEN
const KEY_REFRESH_TOKEN = process.env.KEY_REFRESH_TOKEN
const JWT_KEY = {
    KEY_ACCESS_TOKEN,
    KEY_REFRESH_TOKEN
}
const TWILO = {
    sid,
    authToken
}
module.exports = {
    connection,
    TWILO,
    JWT_KEY
}