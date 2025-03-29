const { query_db } = require("../func/ConnectSQL");

exports.reqMap = async () => {
  try {
    console.log("reqMap");
    const send_track = await query_db(
      `select location_c_id, location_c_lat,location_c_lon, location_c_send_longdo, location_c_subdistrict, location_c_district, location_c_province, location_c_postcode from location_c where location_c_send_longdo <> "Y" or location_c_send_longdo is null`,
      "client"
    );
    const locations = await query_db(query, "client");
    console.log(locations.location_c_id);

    // return locations;
    // app.get("/reverse-geocode", async (req, res) => {
    //   try {
    //     const [rows] = await db.query("SELECT lon,lat FROM locations");
    //     if (rows.length === 0) {
    //       return res.status(404).json({ error: "Location not found" });
    //     }

    //     console.log(`📍 Processing ${rows.length} locations...`);

    //     let successCount = 0;
    //     let failCount = 0;
    //     const result = [];

    //     for (let i = 0; i < rows.length; i++) {
    //       const location = rows[i];

    //       if (!location.lon || !location.lat) {
    //         console.warn(`⚠️ Skipping invalid data at index ${i}`);
    //         result.push({ error: "Invalid data in database" });
    //         failCount++;
    //         continue;
    //       }

    //       try {
    //         await delay(i * 1000);

    //         const apiResponse = await axios.get(
    //           "https://api.longdo.com/map/services/address",
    //           {
    //             params: {
    //               key: process.env.KEY,
    //               lon: location.lon,
    //               lat: location.lat,
    //             },
    //           }
    //         );

    //         if (
    //           typeof apiResponse.data === "string" &&
    //           apiResponse.data.includes("Too many requests")
    //         ) {
    //           console.error("🚨 Too many requests! Stopping process...");
    //           throw new Error("Too many requests");
    //         }

    //         result.push({
    //           lon: location.lon,
    //           lat: location.lat,
    //           address: apiResponse.data,
    //         });
    //         successCount++;
    //         console.log(
    //           `✅ Success [${successCount}/${rows.length}] - lon: ${location.lon}, lat: ${location.lat}`
    //         );
    //       } catch (error) {
    //         failCount++;
    //         console.error(
    //           `❌ Failed [${failCount}] - lon: ${location.lon}, lat: ${location.lat}, error: ${error.message}`
    //         );
    //         result.push({
    //           lon: location.lon,
    //           lat: location.lat,
    //           error: error.message,
    //         });
    //       }
    //     }

    //     fs.writeFileSync(
    //       "geocode_results.json",
    //       JSON.stringify(result, null, 2),
    //       "utf8"
    //     );

    //     console.log(
    //       `🏁 Process completed: ${successCount} success, ${failCount} failed`
    //     );
    //     res.status(200).json({ message: "success", data: result });
    //   } catch (err) {
    //     res.status(500).json({ error: err.message });
    //   }
    // });
  } catch (error) {
    console.log(`ERROR : ${error.message}`);
  }
};
