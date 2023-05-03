require('dotenv').config(".env");
const { connection } = require("./config")
const express = require("express")
const app = express();
const auth = require("./router/auth");
const user = require("./router/user");
const products = require("./router/products");
const cors = require('cors');
const xss = require('xss-clean');
const path = require("path");
const httpStatus = require('http-status');
const md5 = require("md5");
console.log(md5(123123));

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cors());
app.options('*', cors());
app.use(xss());
app.use("/public/images", express.static(path.join(__dirname, "/public/images")));


app.get("/api", (req, res) => {
  res.status(200).json({connection: "OK"});
})

app.use((req, res, next) => {
  if(req?.body?.phone?.startsWith("0")) {
      req.body.phone = req.body.phone.replace("0", "+84");
  }
  if(!req.query.idDevice) {
    return res.status(httpStatus.BAD_REQUEST).json({error: "Thiếu Device ID"});
  }
  next();
})


app.use("/api/v1/auth", auth);
app.use("/api/v1/user", user);
app.use("/api/v1/products", products);
connection.getConnection((err, connection) => {
  if (err) {
    console.log('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database successfully!');
  
  connection.release();
});
app.listen(process.env.PORT_SERVER || 3000, () => {
  console.log("http://localhost:" + (process.env.PORT_SERVER || 3000));
})