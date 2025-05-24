const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { pool } = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/messages'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match('image.*')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

router.get('/conversations', authenticate, async (req, res) => {
  try {
    const [conversations] = await pool.query(
      `SELECT 
        c.id, 
        c.book_id, 
        b.title as book_title,
        (SELECT bi.image_path FROM book_images bi WHERE bi.book_id = c.book_id LIMIT 1) as book_image,
        CASE 
          WHEN c.user1_id = ? THEN u2.id 
          ELSE u1.id 
        END as interlocutor_id,
        CASE 
          WHEN c.user1_id = ? THEN u2.username 
          ELSE u1.username 
        END as interlocutor_name,
        CASE
          WHEN c.user1_id = ? THEN u2.avatar
          ELSE u1.avatar
        END as interlocutor_avatar,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_date,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) as unread_count
       FROM conversations c
       LEFT JOIN users u1 ON c.user1_id = u1.id
       LEFT JOIN users u2 ON c.user2_id = u2.id
       LEFT JOIN book b ON c.book_id = b.id
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY last_message_date DESC`,
      [req.userId, req.userId, req.userId, req.userId, req.userId, req.userId]
    );

    res.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        book_id: conv.book_id,
        book_title: conv.book_title,
        book_image: conv.book_image ? `http://localhost:5001/uploads/${conv.book_image}` : null,
        interlocutor_id: conv.interlocutor_id,
        interlocutor_name: conv.interlocutor_name,
        interlocutor_avatar: conv.interlocutor_avatar ? `http://localhost:5001${conv.interlocutor_avatar}` : null,
        last_message: conv.last_message || "Nouvelle conversation",
        last_message_date: conv.last_message_date || new Date().toISOString(),
        unread_count: conv.unread_count || 0
      }))
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      error: "Database error",
      details: err.message,
      sqlError: err.sqlMessage
    });
  }
});

router.delete('/conversations/:id', authenticate, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.userId;

    const [conv] = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, userId, userId]
    );

    if (!conv.length) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    await pool.query(`DELETE FROM messages WHERE conversation_id = ?`, [conversationId]);
    await pool.query(`DELETE FROM conversations WHERE id = ?`, [conversationId]);

    res.json({ success: true });
    
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { bookId, recipientId } = req.body;
    const userId = req.userId;

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
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post('/conversations/:conversationId/mark-as-read', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    await pool.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking as read:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const [convCheck] = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, userId, userId]
    );

    if (convCheck.length === 0) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const [messages] = await pool.query(
      `SELECT 
        m.id,
        m.sender_id,
        u.username as sender_name,
        u.avatar as sender_avatar,
        m.content,
        m.image_url,
        m.created_at,
        m.is_read
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC`,
      [conversationId]
    );

    await pool.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, userId]
    );

    res.json({ messages });

  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const [convCheck] = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [conversationId, userId, userId]
    );

    if (convCheck.length === 0) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const [result] = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES (?, ?, ?)`,
      [conversationId, userId, content]
    );

    res.status(201).json({
      messageId: result.insertId
    });

  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post('/conversations/:conversationId/messages/image', 
  authenticate, 
  upload.single('image'), 
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.userId;
      const imagePath = req.file ? `/uploads/messages/${req.file.filename}` : null;

      const [convCheck] = await pool.query(
        `SELECT id FROM conversations 
         WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [conversationId, userId, userId]
      );

      if (convCheck.length === 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const [result] = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, image_url)
         VALUES (?, ?, ?, ?)`,
        [conversationId, userId, '', imagePath]
      );

      res.status(201).json({
        messageId: result.insertId,
        imageUrl: imagePath
      });

    } catch (err) {
      console.error('Error sending image message:', err);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        error: "Erreur serveur",
        details: err.message
      });
    }
  }
);

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await pool.query(
      `SELECT COUNT(*) as unreadCount
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.is_read = 0 AND m.sender_id != ? 
         AND (c.user1_id = ? OR c.user2_id = ?)`,
      [userId, userId, userId]
    );

    res.json({ unreadCount: rows[0].unreadCount });

  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;