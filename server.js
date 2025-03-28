const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { default: axios } = require("axios");
const fs = require("fs");
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/reverse-geocode", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT lon,lat FROM locations");
    if (rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    console.log(`📍 Processing ${rows.length} locations...`);

    let successCount = 0;
    let failCount = 0;
    const result = [];

    for (let i = 0; i < rows.length; i++) {
      const location = rows[i];

      if (!location.lon || !location.lat) {
        console.warn(`⚠️ Skipping invalid data at index ${i}`);
        result.push({ error: "Invalid data in database" });
        failCount++;
        continue;
      }

      try {
        await delay(i * 1000);

        const apiResponse = await axios.get(
          "https://api.longdo.com/map/services/address",
          {
            params: {
              key: "bf987ce1661f73a4b887cb341d25963c",
              lon: location.lon,
              lat: location.lat,
            },
          }
        );

        if (
          typeof apiResponse.data === "string" &&
          apiResponse.data.includes("Too many requests")
        ) {
          console.error("🚨 Too many requests! Stopping process...");
          throw new Error("Too many requests");
        }

        result.push({
          lon: location.lon,
          lat: location.lat,
          address: apiResponse.data,
        });
        successCount++;
        console.log(
          `✅ Success [${successCount}/${rows.length}] - lon: ${location.lon}, lat: ${location.lat}`
        );
      } catch (error) {
        failCount++;
        console.error(
          `❌ Failed [${failCount}] - lon: ${location.lon}, lat: ${location.lat}, error: ${error.message}`
        );
        result.push({
          lon: location.lon,
          lat: location.lat,
          error: error.message,
        });
      }
    }

    fs.writeFileSync(
      "geocode_results.json",
      JSON.stringify(result, null, 2),
      "utf8"
    );

    console.log(
      `🏁 Process completed: ${successCount} success, ${failCount} failed`
    );
    res.status(200).json({ message: "success", data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log(`🚀 Server is running on port 3001`));
