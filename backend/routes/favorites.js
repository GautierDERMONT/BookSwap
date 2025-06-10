const express = require('express');
const router = express.Router();
const Favorites = require('../models/Favorites');

router.post('/favorites', async (req, res) => {
  const { userId, bookId } = req.body;

  if (!userId || !bookId) {
    return res.status(400).json({ error: 'userId and bookId are required' });
  }

  try {
    const exists = await Favorites.checkExisting(userId, bookId);
    if (exists) {
      return res.status(200).json({ message: 'Ce livre est déjà dans vos favoris' });
    }

    await Favorites.add(userId, bookId);
    res.status(201).json({ message: 'Favori ajouté' });
  } catch (err) {
    console.error('Erreur ajout favori:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.delete('/favorites', async (req, res) => {
  const { userId, bookId } = req.body;

  if (!userId || !bookId) {
    return res.status(400).json({ error: 'userId and bookId are required' });
  }

  try {
    await Favorites.remove(userId, bookId);
    res.status(200).json({ message: 'Favori supprimé' });
  } catch (err) {
    console.error('Erreur suppression favori:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/favorites/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const favorites = await Favorites.getUserFavorites(userId);
    res.status(200).json(favorites);
  } catch (err) {
    console.error('Erreur récupération favoris:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;