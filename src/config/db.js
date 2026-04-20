const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 4000,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false,
  },
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ TiDB Cloud connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };