const { reqMap } = require("../req/reqMap");
const { query_db } = require("./ConnectSQL");

exports.syncData = async () => {
  try {
    const dbHost = await query_db("SELECT id, lon, lat FROM locations", "host");
    const dbClient = await query_db(
      "SELECT location_c_id FROM location_c",
      "client"
    );

    if (!dbHost || dbHost.length === 0) {
      throw new Error("No data found in HOST database.");
    }

    if (!dbClient) {
      console.log("No data found in CLIENT database. Starting sync with HOST.");
    }

    const clientIds = new Set(dbClient.map((record) => record.location_c_id));

    if (dbClient.length === dbHost.length) {
      console.log(
        "CLIENT database is already in sync with HOST. Running reqMap()."
      );
      reqMap();
      return;
    }

    let newRecords = 0;

    for (const hostRecord of dbHost) {
      if (!clientIds.has(hostRecord.id)) {
        console.log(
          `ID : ${hostRecord.id} does not exist in CLIENT. Adding...`
        );

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
            newRecords++;
          } else {
            console.log(`Failed to insert ID : ${hostRecord.id} into CLIENT.`);
          }
        } catch (error) {
          console.error(
            `Error inserting ID ${hostRecord.id}: ${error.message}`
          );
        }
      }
    }

    console.log(`Sync completed. ${newRecords} new records added.`);

    const updatedClient = await query_db(
      "SELECT location_c_id FROM location_c",
      "client"
    );

    if (updatedClient.length === dbHost.length) {
      console.log(
        "CLIENT database is now fully synced with HOST. Running reqMap()."
      );
      reqMap();
    }
  } catch (error) {
    console.log(`ERROR : ${error.message}`);
  }
};
