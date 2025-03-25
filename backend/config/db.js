// backend/config/db.js
const mysql = require('mysql2/promise'); // Utilise l'interface async/await

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Utilisateur par défaut WAMP
  password: '', // Mot de passe par défaut (vide)
  database: 'bookswap',
  waitForConnections: true,
  connectionLimit: 10,
});

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected via WAMP...');
    return pool;
  } catch (err) {
    throw err;
  }
};

module.exports = { connectDB, pool };