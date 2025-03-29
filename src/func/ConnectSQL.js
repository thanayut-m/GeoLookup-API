const mysql = require("mysql2/promise");
require("dotenv").config();

const connectDbHost = mysql.createPool({
  host: process.env.HOST_HOST,
  user: process.env.USER_HOST,
  password: process.env.PASSWORD_HOST,
  database: process.env.DATABASE_HOST,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectDbClient = mysql.createPool({
  host: process.env.HOST_CLIENT,
  user: process.env.USER_CLIENT,
  password: process.env.PASSWORD_CLIENT,
  database: process.env.DATABASE_CLIENT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

exports.checkDatabaseConnection = async (req, res) => {
  try {
    const type = req.query.type || "host";
    const dbPool = type === "client" ? connectDbClient : connectDbHost;

    const connection = await dbPool.getConnection();
    await connection.ping();
    connection.release();

    console.log("✅ MySQL connected successfully!");
    res.json({ success: true, message: "Database connected successfully" });
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Database connection failed" });
  }
};

exports.query_db = async (query, type = "host") => {
  try {
    const dbPool = type === "client" ? connectDbClient : connectDbHost;
    const connection = await dbPool.getConnection();

    const [rows] = await connection.query(query);

    connection.release();
    console.log(`Query executed: ${query}`);

    if (query.toLowerCase().startsWith("select")) {
      return rows;
    } else {
      if (rows && rows.affectedRows !== undefined) {
        return { affectedRows: rows.affectedRows };
      } else {
        console.error("No affected rows returned from query.");
        return { affectedRows: 0 };
      }
    }
  } catch (error) {
    console.error("Database query failed:", error.message);
    return null;
  }
};
