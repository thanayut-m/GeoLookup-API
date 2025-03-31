const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const { checkDatabaseConnection } = require("./src/func/ConnectSQL");
const { syncData } = require("./src/func/syncData");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
const port = process.env.PORT;

app.get("/connect-db", checkDatabaseConnection);

syncData();

setInterval(syncData, 2000);

app.listen(port, () => console.log(`Server is running on port ${port}`));
