const { connection } = require("./config")
const express = require("express")
const app = express();
const auth = require("./router/auth");
const cors = require('cors');
const xss = require('xss-clean');
const path = require("path");



app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cors());
app.options('*', cors());
app.use(xss());
app.use("/public/images", express.static(path.join(__dirname, "/public/images")));

app.use((req, res, next) => {
  if(req.body.phone.startsWith("0")) {
      req.body.phone = req.body.phone.replace("0", "+84");
  }
  next();
})


app.use("/auth", auth);
connection.getConnection((err, connection) => {
  if (err) {
    console.log('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database successfully!');
  app.listen(3000, () => {
    console.log("http://localhost:3000");
  })
  connection.release();
});
