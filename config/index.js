const { connection } = require("./database")
const sid = "AC609cd5844354890f6f1d5c47ac763502";
const authToken = "e662bef9ae161c19d3abebde89706dae";

const TWILO = {
    sid,
    authToken
}
module.exports = {
    connection,
    TWILO
}