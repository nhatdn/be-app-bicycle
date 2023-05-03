const { connection } = require("../config")
const HttpStatus = require("http-status");
const PromiseFC = require("../utils/promise");
const md5 = require("md5");
const CODE_MSG = require("../constants/codeMSG");
const { v4: uuidv4 } = require("uuid");



const postProducts = PromiseFC(async (req, res, next) => {
    try {
        const name = req.body.name.trim();
        const idCategory = req.body.idCategory;
        const userID = req.id;
        let sizes = [];
        try {
            sizes = JSON.parse(req.body.sizes);
        } catch(e) {
            console.log(e);
            res.json(sizes);
            return;
        }
        console.log(typeof sizes);
        const files = req.files?.["covers"];
        const idProduct = uuidv4();

        if (!name || !idCategory || !sizes) { //|| !files
            return res.status(HttpStatus.BAD_REQUEST).json({
                error: CODE_MSG.LACK_DATA
            })
        } else {
            // const pathOne = (files[0]?.destination + files[0]?.filename) && "";
            // const pathTwo = (files[1]?.destination + files[1]?.filename) && "";
            // const pathThree = (files[2]?.destination + files[2]?.filename) && "";
            // const pathFour = (files[3]?.destination + files[3]?.filename) && "";
            // console.log(pathOne)
            // console.log(pathTwo)
            // console.log(pathThree)
            // console.log(pathFour)
            // await connection.promise().execute("INSERT INTO products (id, name, imageFirst, imageSeconds, imageThird, imageFourth, user_id, category_id) VALUE (? , ? , ? , ?, ?, ?, ?, ?)", [idProduct, name, pathOne, pathTwo, pathThree, pathFour, userID, idCategory]);
            for (let i = 0; i < sizes.length; i++) {
                sizes[i].id = uuidv4();
                let size = sizes[i];
                await connection.promise().execute("INSERT INTO sizes (id, product_id, size) VALUE ( ?, ?, ? )", [size.id, idProduct, size.name]);
            }
            for (let i = 0; i < sizes.length; i++) {
                let size = sizes[i];
                for(let j = 0; j < size.colors.length; j++) {
                    let color = size.colors[j];
                    console.log(size.id, color.color, color.amount, color.price);
                    await connection.promise().execute("INSERT INTO colors (size_id, color, price, quantity) VALUE (?, ?, ?, ?)", [size.id, color.color, color.price, color.amount]);
                }
            }
            res.status(HttpStatus.OK).json({
                
            });
        }
    } catch (e) {
        console.log(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: CODE_MSG.SOMETHING_IS_WRONG });
    }

})

module.exports = {
    postProducts,
}