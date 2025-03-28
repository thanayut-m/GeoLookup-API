const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { default: axios } = require("axios");
const mysql = require("mysql2/promise");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "geolookup",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.get("/reverse-geocode", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT lon,lat FROM locations");
    if (rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }
    console.log(rows);

    const result = await Promise.all(
      rows.map(async (location) => {
        if (!location.lon || !location.lat) {
          return { error: "Invalid data in database" };
        }
        try {
          const result = await axios.get(
            "https://api.longdo.com/map/services/address",
            {
              params: {
                key: "bf987ce1661f73a4b887cb341d25963c",
                lon: location.lon,
                lat: location.lat,
              },
            }
          );
          return {
            lon: location.lon,
            lat: location.lat,
            address: result.data,
          };
        } catch (error) {
          return { lon: location.lon, lat: location.lat, error: error.message };
        }
      })
    );

    res.status(200).json({ message: "success", data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log(`Server is Running Port : 3001`));
