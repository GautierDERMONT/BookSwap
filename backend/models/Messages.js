const pool = require('../config/db');

const Message = {
  // Créer une nouvelle conversation
  createConversation: async (user1Id, user2Id, bookId) => {
    const [result] = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, book_id) 
       VALUES (?, ?, ?)`,
      [user1Id, user2Id, bookId]
    );
    return result.insertId;
  },

  // Vérifier si une conversation existe déjà
  findConversation: async (user1Id, user2Id, bookId) => {
    const [rows] = await pool.query(
      `SELECT id FROM conversations 
       WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
       AND book_id = ?`,
      [user1Id, user2Id, user2Id, user1Id, bookId]
    );
    return rows[0]?.id;
  },

  // Envoyer un message
  createMessage: async (conversationId, senderId, content, imageUrl = null) => {
    const [result] = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, image_url)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, content, imageUrl]
    );
    return result.insertId;
  },

  // Récupérer les conversations d'un utilisateur
  getUserConversations: async (userId) => {
    const [conversations] = await pool.query(
      `SELECT c.id, c.book_id, 
              u.id as user_id, u.username, u.avatar,
              b.title as book_title, b.image_url as book_image,
              m.content as last_message, m.created_at as last_message_at
       FROM conversations c
       JOIN users u ON (u.id = CASE 
                            WHEN c.user1_id = ? THEN c.user2_id 
                            ELSE c.user1_id 
                          END)
       LEFT JOIN books b ON c.book_id = b.id
       LEFT JOIN messages m ON m.id = (
         SELECT id FROM messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC LIMIT 1
       )
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY last_message_at DESC`,
      [userId, userId, userId]
    );
    return conversations;
  },

  // Récupérer les messages d'une conversation
  getConversationMessages: async (conversationId, userId) => {
    const [messages] = await pool.query(
      `SELECT m.*, u.username, u.avatar 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Marquer les messages comme lus
    await pool.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, userId]
    );

    return messages;
  }
};

module.exports = Message;