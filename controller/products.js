const { connection } = require("../config")
const HttpStatus = require("http-status");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");
const CODE_MSG = require("../constants/codeMSG");

const postProducts = PromiseFC(async (req, res, next) => {
    const name = req.body.name.trim();
    const idCategory = idCategory;
    const userID = req.id;
    const sizes = req.body.sizes;
    const files = req.files;
    if(!name || !idCategory || !size || !files) {
        res.status(HttpStatus.BAD_REQUEST).json({
            error: CODE_MSG.LACK_DATA
        })
    } else {
        const pathOne = (files[0]?.destination + files[0]?.filename) && ""; 
        const pathTwo = (files[1]?.destination + files[1]?.filename) && "";
        const pathThree = (files[2]?.destination + files[2]?.filename) && "";
        const pathFour = (files[3]?.destination + files[3]?.filename) && "";
        await connection.promise().execute("INSERT INTO products (name, imageFirst, imageSeconds, imageThird, imageFourth, user_id, category_id) VALUE (? , ? , ? , ?, ?, ?)", [name, pathOne, pathTwo,pathThree, pathFour, userID, idCategory]);
        await Promise.all(sizes.map(size => connection.promise().execute("INSERT INTO sizes (product_id, size) VALUES ( ?, ? )", [productId, size])));
    }

})

module.exports = {
    postProducts,
}