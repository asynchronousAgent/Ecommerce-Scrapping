const express = require("express");
const scrapping = require("./routes/scrapping");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/fetch", scrapping);

module.exports = app;
