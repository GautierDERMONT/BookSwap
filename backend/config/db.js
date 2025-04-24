const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bookswap',
  waitForConnections: true,
  connectionLimit: 10,
});

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ MySQL connecté via WAMP...');
  } catch (err) {
    console.error('❌ Erreur connexion MySQL :', err);
    throw err;
  }
};

module.exports = { connectDB, pool };
