require("dotenv").config();
const mysql = require("mysql2/promise");

async function main() {
  const password = process.env.STORE_MANAGER_PASSWORD;
  if (!password || password === "ChangeThis_StrongPassword123!") {
    throw new Error("Set STORE_MANAGER_PASSWORD in .env to a strong, unique password first.");
  }

  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const adminPassword = process.env.DB_PASSWORD || "";
  const db = process.env.DB_NAME || "small_retail_store";
  const conn = await mysql.createConnection({ host, port, user, password: adminPassword });
  const account = "store_manager";
  const escapedPassword = password.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  try {
    await conn.query(`CREATE USER IF NOT EXISTS '${account}'@'localhost' IDENTIFIED BY '${escapedPassword}'`);
    await conn.query(`GRANT SELECT, INSERT, UPDATE ON \`${db}\`.* TO '${account}'@'localhost'`);
    await conn.query(`REVOKE UPDATE ON \`${db}\`.* FROM '${account}'@'localhost'`);
    await conn.query(`GRANT DELETE ON \`${db}\`.Sales TO '${account}'@'localhost'`);
    await conn.query("FLUSH PRIVILEGES");
    console.log("store_manager created. Permissions: SELECT, INSERT; UPDATE revoked; DELETE on Sales granted.");
  } finally {
    await conn.end();
  }
}
main().catch((err) => {
  console.error("Could not configure store_manager:", err.message);
  process.exit(1);
});
