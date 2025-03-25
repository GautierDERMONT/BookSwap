// backend/server.js
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');


const PORT = process.env.PORT || 5001; 

// Fonction qui gère la connexion à la base de données
async function startServer() {
  try {
    // Connexion à la base de données
    await connectDB();
    console.log('MySQL connected!');

    // Démarrer le serveur
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('DB connection failed!', err);
  }
}

startServer();
