const { default: axios } = require("axios");
const { query_db } = require("../func/ConnectSQL");

exports.reqMap = async () => {
  try {
    console.log("reqMap");

    const send_track = await query_db(
      `SELECT location_c_id, location_c_lat, location_c_lon, location_c_send_longdo 
       FROM location_c 
       WHERE location_c_send_longdo <> 'Y' OR location_c_send_longdo IS NULL`,
      "client"
    );

    if (send_track.length > 0) {
      console.log(send_track.map((location) => location.location_c_id));

      for (const location of send_track) {
        try {
          const apiResponse = await axios.get(
            "https://api.longdo.com/map/services/address",
            {
              params: {
                key: process.env.KEY,
                lon: location.location_c_lon,
                lat: location.location_c_lat,
              },
            }
          );

          console.log(
            `Response for ID ${location.location_c_id}:`,
            apiResponse.data
          );

          const { subdistrict, district, province, postcode } =
            apiResponse.data;

          const updateQuery = `
            UPDATE location_c 
            SET 
              location_c_subdistrict = '${subdistrict || ""}', 
              location_c_district = '${district || ""}', 
              location_c_province = '${province || ""}', 
              location_c_postcode = '${postcode || ""}', 
              location_c_send_longdo = 'Y'
            WHERE location_c_id = ${location.location_c_id}
          `;

          const result = await query_db(updateQuery, "client");

          if (result && result.affectedRows > 0) {
            console.log(
              `✅ Updated ID ${location.location_c_id} successfully.`
            );
          } else {
            console.log(`❌ Failed to update ID ${location.location_c_id}.`);
          }
        } catch (error) {
          if (error.response && error.response.status === 429) {
            console.warn(
              `⏩ Skipping ID ${location.location_c_id} due to Too Many Requests.`
            );
            continue;
          }

          console.error(
            `❌ Error fetching address for ID ${location.location_c_id}:`,
            error.message
          );
        }
      }
    } else {
      console.log("No data found.");
    }
  } catch (error) {
    console.error("❌ Unexpected error in reqMap:", error.message);
  }
};
