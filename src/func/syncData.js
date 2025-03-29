const { reqMap } = require("../req/reqMap");
const { query_db } = require("./ConnectSQL");

exports.syncData = async () => {
  try {
    const dbHost = await query_db("select id,lon,lat from locations", "host");
    const dbclient = await query_db(
      "select location_c_id from location_c",
      "client"
    );

    if (!dbHost || dbHost.length === 0) {
      throw new Error("No data found in HOST database.");
    }

    if (!dbclient || dbclient.length === 0) {
      console.log("No data found in CLIENT database. Starting sync with HOST.");
    }

    for (const hostRecord of dbHost) {
      const clientRecord = dbclient.find(
        (record) => record.location_c_id === hostRecord.id
      );

      if (!clientRecord) {
        console.log(`ID : ${hostRecord.id} does not exist in CLIENT.`);

        if (!hostRecord.id || !hostRecord.lon || !hostRecord.lat) {
          console.log(`Skipping ID ${hostRecord.id} due to missing data.`);
          continue;
        }

        const insertQuery = `
            INSERT INTO location_c (location_c_id, location_c_lon, location_c_lat)
            VALUES (${hostRecord.id}, ${hostRecord.lon}, ${hostRecord.lat})
          `;

        try {
          const result = await query_db(insertQuery, "client");

          if (result && result.affectedRows > 0) {
            console.log(
              `ID : ${hostRecord.id} inserted successfully into CLIENT.`
            );
          } else {
            console.log(`Failed to insert ID : ${hostRecord.id} into CLIENT.`);
          }
        } catch (error) {
          console.error(
            `Error inserting ID ${hostRecord.id}: ${error.message}`
          );
        }
      } else {
        console.log(`ID : ${hostRecord.id} already exists in CLIENT.`);
        reqMap();
      }
    }
  } catch (error) {
    console.log(`ERROR : ${error.message}`);
  }
};
