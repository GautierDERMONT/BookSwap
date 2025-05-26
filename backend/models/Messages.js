const pool = require('../config/db');

// Objet Message regroupant les méthodes pour gérer les conversations et messages
const Message = {

  // Crée une nouvelle conversation entre deux utilisateurs autour d'un livre
  createConversation: async (user1Id, user2Id, bookId) => {
    const [result] = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, book_id) 
       VALUES (?, ?, ?)`,
      [user1Id, user2Id, bookId]
    );
    return result.insertId;
  },

  // Vérifie si une conversation existe déjà entre deux utilisateurs pour un livre donné
  findConversation: async (user1Id, user2Id, bookId) => {
    const [rows] = await pool.query(
      `SELECT id FROM conversations 
       WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
       AND book_id = ?`,
      [user1Id, user2Id, user2Id, user1Id, bookId]
    );
    return rows[0]?.id;
  },

  // Envoie un message dans une conversation donnée, avec option d'image jointe
  createMessage: async (conversationId, senderId, content, imageUrl = null) => {
    const [result] = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, image_url)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, content, imageUrl]
    );
    return result.insertId;
  },

  // Récupère la liste des conversations d'un utilisateur avec les infos sur l'interlocuteur et dernier message
  getUserConversations: async (userId) => {
    const [conversations] = await pool.query(
      `SELECT 
        c.id, 
        c.book_id, 
        b.title as book_title,
        CASE 
          WHEN c.user1_id = ? THEN u2.id 
          ELSE u1.id 
        END as interlocutor_id,
        CASE 
          WHEN c.user1_id = ? THEN u2.username 
          ELSE u1.username 
        END as interlocutor_name,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_date,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) as unread_count
      FROM conversations c
      LEFT JOIN users u1 ON c.user1_id = u1.id
      LEFT JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN book b ON c.book_id = b.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY last_message_date DESC`,
      [userId, userId, userId, userId, userId]
    );
    return conversations;
  },

  // Récupère tous les messages d'une conversation et marque ceux reçus comme lus
  getConversationMessages: async (conversationId, userId) => {
    const [messages] = await pool.query(
      `SELECT 
        m.*, 
        u.username as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Marquage des messages non lus envoyés par l'autre utilisateur comme lus
    await pool.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, userId]
    );

    return messages;
  }
};

module.exports = Message;
