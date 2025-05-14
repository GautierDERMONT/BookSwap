const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bookswap',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'local' 

});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connecté via WAMP...');
  } catch (err) {
    console.error('❌ Erreur connexion MySQL :', err);
    throw err;
  }
};

// Vérification périodique de la connexion
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
  } catch (err) {
    console.error('❌ Connexion MySQL perdue :', err);
  }
}, 60000); // Vérifie toutes les minutes

module.exports = { connectDB, pool };