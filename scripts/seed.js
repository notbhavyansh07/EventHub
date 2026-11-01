// Creates (or resets) the default admin account:  npm run seed
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

(async () => {
  const hash = await bcrypt.hash('Admin@123', 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
    ['Administrator', 'admin@eventhub.com', hash]);
  console.log('Admin ready -> admin@eventhub.com / Admin@123   (change this password!)');
  process.exit(0);
})().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
