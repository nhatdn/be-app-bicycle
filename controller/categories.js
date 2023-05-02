const { connection } = require("../config")
const HttpStatus = require("http-status");
const PromiseFC = require("../utils/promise");
const CODE_MSG = require("../constants/codeMSG");

const listCategories = PromiseFC(async (req, res, next) => {
    try {
        const [[data]] = await connection.promise().query("SELECT * FROM category");
        res.status(HttpStatus.OK).json({
            data,
        })
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
    
})

const updateCategory = PromiseFC(async (req, res, next) => {
    try {
        const id = req.query.id;
        const name = req.query.name.trim();
        const [[data]] = await connection.promise().query("UPDATE category SET name = ? WHERE id = ?", [name, id]);
        if(data) {
            res.status(HttpStatus.OK).json({
                data: CODE_MSG.UPDATE_CATEGORY_SUCCESS
            })
        }
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

const createCategory =  PromiseFC(async (req, res, next) => {
    try {
        const name = req.query?.name.trim();
        const [[data]] = await connection.promise().query("INSERT INTO category (name) VALUE (?)", [name]);
        res.status(HttpStatus.OK).json({
            data,
        })
    } catch(e) {
        console.log(e);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }
})

module.exports = {
    listCategories,
    createCategory,
    updateCategory
}