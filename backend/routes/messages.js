const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Message = require('../models/Messages');

// Démarrer une conversation depuis la page livre
router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { bookId, recipientId } = req.body;
    const userId = req.userId;

    // Vérifier si conversation existe déjà
    const existingConv = await Message.findConversation(userId, recipientId, bookId);
    if (existingConv) {
      return res.json({ conversationId: existingConv });
    }

    // Créer nouvelle conversation
    const conversationId = await Message.createConversation(userId, recipientId, bookId);
    res.status(201).json({ conversationId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoyer un message
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { conversationId, content, imageUrl } = req.body;
    const messageId = await Message.createMessage(conversationId, req.userId, content, imageUrl);
    res.status(201).json({ messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer les conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.userId);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer les messages d'une conversation
router.get('/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const messages = await Message.getConversationMessages(req.params.id, req.userId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;