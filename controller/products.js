const { connection } = require("../config")
const HttpStatus = require("http-status");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");
const CODE_MSG = require("../constants/codeMSG");

const postProducts = PromiseFC((req, res, next) => {
    const name = req.body.name.trim();
    const idCategory = idCategory;
    const size = req.body.size;
    if(!name || !idCategory || !size) {
        res.status(HttpStatus.BAD_REQUEST).json({
            error: CODE_MSG.LACK_DATA
        })
    } else {
        
    }

})