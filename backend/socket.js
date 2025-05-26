const socketIO = require('socket.io');

let io; // Variable globale pour stocker l'instance socket.io

// Initialisation de socket.io avec le serveur HTTP et configuration CORS
const initSocket = (server) => {
  io = socketIO(server, {
    cors: { origin: 'http://localhost:5173' }, // Autorisation CORS pour le front sur ce port
  });

  // Gestion des connexions clients
  io.on('connection', (socket) => {
    console.log('New client connected');

    // Écoute de l'événement 'sendMessage' envoyé par un client
    socket.on('sendMessage', (message) => {
      io.emit('newMessage', message); // Diffusion du message à tous les clients connectés
    });

    // Gestion de la déconnexion d'un client
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

// Fonction pour récupérer l'instance socket.io (utile dans d'autres fichiers)
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIO };
