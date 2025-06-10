const socketIO = require('socket.io');
const { pool } = require('./config/db'); 

let io;
const connectedUsers = {};

const initSocket = (server) => {
  io = socketIO(server, {
    cors: { 
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('authenticate', (userId) => {
      connectedUsers[userId] = socket.id;
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, senderId, content, isImage } = data;
        
        // Pour les images, stockez seulement le chemin ou l'URL
        const messageContent = isImage ? '' : content;
        const imageUrl = isImage ? content : null;

        const [result] = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, content, image_url)
          VALUES (?, ?, ?, ?)`,
          [conversationId, senderId, messageContent, imageUrl]
        );

        // Récupérez le message complet
        const [messages] = await pool.query(`
          SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `, [result.insertId]);

        if (messages.length > 0) {
          io.to(`conversation_${conversationId}`).emit('newMessage', messages[0]);
        }
        
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      for (const [userId, socketId] of Object.entries(connectedUsers)) {
        if (socketId === socket.id) {
          delete connectedUsers[userId];
          break;
        }
      }
    });
  });
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIO, connectedUsers };