const { connection } = require("../config")
const HttpStatus = require("http-status");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");
const CODE_MSG = require("../constants/codeMSG");
const { v4: uuidv4 } = require("uuid");


const postProducts = PromiseFC(async (req, res, next) => {
    try {
        const name = req.body.name.trim();
        const idCategory = idCategory;
        const userID = req.id;
        const sizes = req.body.sizes;
        const files = req.files;
        const idProduct = uuidv4();

        if (!name || !idCategory || !size || !files) {
            res.status(HttpStatus.BAD_REQUEST).json({
                error: CODE_MSG.LACK_DATA
            })
        } else {
            const pathOne = (files[0]?.destination + files[0]?.filename) && "";
            const pathTwo = (files[1]?.destination + files[1]?.filename) && "";
            const pathThree = (files[2]?.destination + files[2]?.filename) && "";
            const pathFour = (files[3]?.destination + files[3]?.filename) && "";
            await connection.promise().execute("INSERT INTO products (id, name, imageFirst, imageSeconds, imageThird, imageFourth, user_id, category_id) VALUE (? , ? , ? , ?, ?, ?)", [idProduct, name, pathOne, pathTwo, pathThree, pathFour, userID, idCategory]);
            for (let i = 0; i < sizes.length; i++) {
                sizes.id = uuidv4();
            }
            await Promise.all(sizes.map(size => connection.promise().execute("INSERT INTO sizes (id, product_id, size) VALUES ( ?, ? )", [size.id, idProduct, size.name])));
            let PromiseAllColors = [];
            sizes.forEach(size => {
                const PromiseColors = size.colors.map(color => connection.promise().execute("INSERT INTO colors (size_id, name, amount, price) VALUES (?, ?, ?)"[size.id, color.name, color.amount, color.price]));
                PromiseAllColors = [...PromiseAllColors, ...PromiseColors];
            })
            await Promise.all(PromiseAllColors);

        }
    } catch (e) {
        console.log(e);
        
    }

})

module.exports = {
    postProducts,
}