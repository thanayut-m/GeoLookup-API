const { default: axios } = require("axios");
const { query_db } = require("../func/ConnectSQL");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchAddress = async (lon, lat, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(
        "https://api.longdo.com/map/services/address",
        {
          params: { key: process.env.KEY, lon, lat },
        }
      );

      if (
        typeof response.data === "string" &&
        response.data.includes("Too many requests")
      ) {
        console.warn(`⏩ API limit reached, retrying in 2 seconds...`);
        await delay(2000);
        continue;
      }

      return response.data;
    } catch (error) {
      console.error(
        `❌ Error fetching address (Attempt ${i + 1}):`,
        error.message
      );
      await delay(2000);
    }
  }
  return null;
};

exports.reqMap = async () => {
  try {
    const send_track = await query_db(
      `SELECT location_c_id, location_c_lat, location_c_lon, location_c_send_longdo, location_c_subdistrict 
       FROM location_c
       WHERE location_c_subdistrict = '' OR location_c_subdistrict IS NULL`,
      "client"
    );

    if (send_track.length === 0) {
      console.log("No data found.");
      return;
    }

    console.log(
      "Processing IDs:",
      send_track.map((loc) => loc.location_c_id)
    );

    for (const location of send_track) {
      try {
        const [data1, data2, data3] = await Promise.all([
          fetchAddress(location.location_c_lon, location.location_c_lat),
          delay(1000).then(() =>
            fetchAddress(location.location_c_lon, location.location_c_lat)
          ),
          delay(1000).then(() =>
            fetchAddress(location.location_c_lon, location.location_c_lat)
          ),
        ]);

        if (!data1 || !data2 || !data3) {
          console.warn(
            `⚠️ Skipping ID ${location.location_c_id} (API failed multiple times)`
          );
          continue;
        }

        const subdistrict1 = data1.subdistrict || "";
        const subdistrict2 = data2.subdistrict || "";
        const subdistrict3 = data3.subdistrict || "";

        if (subdistrict1 !== subdistrict2 || subdistrict1 !== subdistrict3) {
          console.warn(
            `⚠️ Skipping ID ${location.location_c_id} (subdistrict mismatch: '${subdistrict1}', '${subdistrict2}', '${subdistrict3}')`
          );

          const updateAPIMessageQuery = `
            UPDATE location_c
            SET api_message = "Mismatch: '${subdistrict1}', '${subdistrict2}', '${subdistrict3}'"
            WHERE location_c_id = ${location.location_c_id}
          `;

          await query_db(updateAPIMessageQuery, "client");
          await delay(2000);
          continue;
        }

        const { district, province, postcode } = data1;
        const updateQuery = `
          UPDATE location_c 
          SET 
            location_c_subdistrict = '${subdistrict1}', 
            location_c_district = '${district || ""}', 
            location_c_province = '${province || ""}', 
            location_c_postcode = '${postcode || ""}', 
            location_c_send_longdo = 'Y'
          WHERE location_c_id = ${location.location_c_id}
        `;

        const result = await query_db(updateQuery, "client");

        if (result && result.affectedRows > 0) {
          console.log(`✅ Updated ID ${location.location_c_id} successfully.`);
        } else {
          console.log(`❌ Failed to update ID ${location.location_c_id}.`);
        }

        await delay(1000);
      } catch (error) {
        console.error(
          `❌ Error processing ID ${location.location_c_id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("❌ Unexpected error in reqMap:", error.message);
  }
};
