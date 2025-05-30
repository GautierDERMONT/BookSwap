const socketIO = require('socket.io');
const { pool } = require('./config/db');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io'
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Client joined conversation ${conversationId}`);
    });

    socket.on('sendMessage', async (messageData) => {
      try {
        const [user] = await pool.query(
          'SELECT username, avatar FROM users WHERE id = ?',
          [messageData.senderId]
        );

        io.to(messageData.conversationId).emit('newMessage', {
          ...messageData,
          sender_name: user[0].username,
          sender_avatar: user[0].avatar,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error broadcasting message:', err);
      }
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