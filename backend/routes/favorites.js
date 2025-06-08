const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Ajouter un favori
router.post('/favorites', async (req, res) => {
  const { userId, bookId } = req.body;

  if (!userId || !bookId) {
    return res.status(400).json({ error: 'userId and bookId are required' });
  }

  try {
    // Vérifier d'abord si le favori existe déjà
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing.length > 0) {
      return res.status(200).json({ message: 'Ce livre est déjà dans vos favoris' });
    }

    // Si le favori n'existe pas, l'ajouter
    await pool.query(
      'INSERT INTO favorites (user_id, book_id) VALUES (?, ?)',
      [userId, bookId]
    );
    res.status(201).json({ message: 'Favori ajouté' });
  } catch (err) {
    console.error('Erreur ajout favori:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Supprimer un favori
router.delete('/favorites', async (req, res) => {
  const { userId, bookId } = req.body;

  // Vérification des paramètres requis
  if (!userId || !bookId) {
    return res.status(400).json({ error: 'userId and bookId are required' });
  }

  try {
    // Suppression du favori dans la base de données
    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );
    res.status(200).json({ message: 'Favori supprimé' });
  } catch (err) {
    // Gestion des erreurs serveur lors de la suppression
    console.error('Erreur suppression favori:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer tous les favoris d'un utilisateur avec images et infos du propriétaire
router.get('/favorites/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT 
        b.*,
        u.id as user_id,
        u.username,
        u.avatar,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) FROM book_images WHERE book_id = b.id) AS images
      FROM favorites f
      JOIN book b ON f.book_id = b.id
      JOIN users u ON b.users_id = u.id
      WHERE f.user_id = ?
      GROUP BY b.id
    `;

    const [rows] = await pool.query(query, [userId]);

    const favorites = rows.map(row => ({
      ...row,
      images: row.images
        ? row.images
            .split(',')
            .map(img => {
              const cleanPath = img.trim().replace(/^\/uploads\//, '');
              return `/uploads/${cleanPath}`;
            })
            .filter(img => img !== '/uploads/')
        : []
    }));

    res.status(200).json(favorites);
  } catch (err) {
    console.error('Erreur récupération favoris:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
