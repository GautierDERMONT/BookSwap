// Importation du module mysql2 avec support des promesses et .env
require('dotenv').config();
const mysql = require('mysql2/promise');

// Création d'un pool de connexions à la base de données MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'local'
});

// Fonction pour établir et tester la connexion à la base de données
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connecté via RailWAy...');
  } catch (err) {
    console.error('❌ Erreur connexion MySQL :', err);
    throw err;
  }
};

console.log("Connecting to MySQL at:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

// Vérifie régulièrement que la connexion MySQL est toujours active (toutes les 60 secondes)
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
  } catch (err) {
    console.error('❌ Connexion MySQL perdue :', err);
  }
}, 60000);

// Exportation de la fonction de connexion et du pool pour les autres modules
module.exports = { connectDB, pool };
