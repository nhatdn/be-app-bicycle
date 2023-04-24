function PromiseFC(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(() =>{
            res.json("Có lỗi xãy ra")
        });
    }
}

module.exports = PromiseFC;