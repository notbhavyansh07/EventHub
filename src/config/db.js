// Database connection pool shared by the whole app.
require('dotenv').config();
const fs = require('fs');

if (process.env.DB_CLIENT === 'sqlite' || process.env.USE_SQLITE === 'true') {
  module.exports = require('./sqliteDb');
} else {
  const mysql = require('mysql2/promise');

  // Cloud databases (e.g. Aiven) need an encrypted connection: set DB_SSL=true.
  let ssl;
  if (process.env.DB_CA_PATH) ssl = { ca: fs.readFileSync(process.env.DB_CA_PATH), rejectUnauthorized: true };
  else if (process.env.DB_SSL === 'true') ssl = { rejectUnauthorized: false };

  module.exports = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eventhub',
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true // DATETIME comes back as plain text, no timezone surprises
  });
}

