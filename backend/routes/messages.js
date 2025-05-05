const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { pool } = require('../config/db');

// Récupérer les conversations d'un utilisateur
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

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
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_date
       FROM conversations c
       LEFT JOIN users u1 ON c.user1_id = u1.id
       LEFT JOIN users u2 ON c.user2_id = u2.id
       LEFT JOIN book b ON c.book_id = b.id
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY last_message_date DESC`,
      [userId, userId, userId, userId]
    );

    res.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        book_id: conv.book_id,
        book_title: conv.book_title,
        interlocutor_id: conv.interlocutor_id,
        interlocutor_name: conv.interlocutor_name,
        last_message: conv.last_message || "Nouvelle conversation",
        last_message_date: conv.last_message_date || new Date().toISOString()
      }))
    });

  } catch (err) {
    console.error('Erreur récupération conversations:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { bookId, recipientId } = req.body;
    const userId = req.userId;

    // Vérifier si la conversation existe déjà
    const [existing] = await pool.query(
      `SELECT id FROM conversations 
       WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
       AND book_id = ?`,
      [userId, recipientId, recipientId, userId, bookId]
    );

    if (existing.length > 0) {
      return res.json({ 
        conversationId: existing[0].id,
        isExisting: true
      });
    }

    // Créer nouvelle conversation
    const [result] = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, book_id) 
       VALUES (?, ?, ?)`,
      [userId, recipientId, bookId]
    );

    res.status(201).json({ 
      conversationId: result.insertId,
      isExisting: false
    });

  } catch (err) {
    console.error('Erreur création conversation:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les messages d'une conversation
router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Vérifier que l'utilisateur fait bien partie de la conversation
    const [convCheck] = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, userId, userId]
    );

    if (convCheck.length === 0) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    // Récupérer les messages
    const [messages] = await pool.query(
      `SELECT 
        m.id,
        m.sender_id,
        u.username as sender_name,
        m.content,
        m.created_at,
        m.is_read
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

    res.json({ messages });

  } catch (err) {
    console.error('Erreur récupération messages:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Envoyer un message
router.post('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    // Vérifier que la conversation existe et que l'utilisateur y a accès
    const [convCheck] = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, userId, userId]
    );

    if (convCheck.length === 0) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    // Insérer le message
    const [result] = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES (?, ?, ?)`,
      [conversationId, userId, content]
    );

    res.status(201).json({
      messageId: result.insertId
    });

  } catch (err) {
    console.error('Erreur envoi message:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;