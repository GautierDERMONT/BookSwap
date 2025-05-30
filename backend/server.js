require('dotenv').config();
const http = require('http');
const server = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}...`);
      console.log('✅ Socket.IO initialisé');
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur:', err);
    process.exit(1);
  }
};

startServer();