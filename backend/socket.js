// backend/socket.js
const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: { origin: 'http://localhost:5173' },
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('sendMessage', (message) => {
      io.emit('newMessage', message); // Broadcast à tous
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIO };