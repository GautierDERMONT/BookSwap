// Chargement des variables d'environnement, import de l'app Express et de la fonction de connexion DB
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');


const PORT = process.env.PORT || 8080; // Définition du port d'écoute, avec fallback

// Fonction principale qui gère la connexion à la base de données et le lancement du serveur
const startServer = async () => {
  try {
    await connectDB(); // Connexion à la base de données avant de lancer le serveur
    
    // Démarrage du serveur sur le port défini et affichage d'un message de succès
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}...`);
    });
  } catch (err) {
    // Gestion des erreurs : affichage de l'erreur et arrêt du processus
    console.error('❌ Impossible de démarrer le serveur:', err);
    process.exit(1);
  }
};

startServer(); // Lancement du serveur
