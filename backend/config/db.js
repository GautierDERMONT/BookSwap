// Importation du module mysql2 avec support des promesses
const mysql = require('mysql2/promise');

// Création d'un pool de connexions à la base de données MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bookswap',
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
    console.log('✅ MySQL connecté via WAMP...');
  } catch (err) {
    console.error('❌ Erreur connexion MySQL :', err);
    throw err;
  }
};

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
