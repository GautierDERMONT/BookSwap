const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Ajouter un favori
router.post('/favorites', async (req, res) => {
  const { userId, bookId } = req.body;

  // Vérification des paramètres requis
  if (!userId || !bookId) {
    return res.status(400).json({ error: 'userId and bookId are required' });
  }

  try {
    // Insertion du favori dans la base de données
    await pool.query(
      'INSERT INTO favorites (user_id, book_id) VALUES (?, ?)',
      [userId, bookId]
    );
    res.status(201).json({ message: 'Favori ajouté' });
  } catch (err) {
    // Gestion des erreurs serveur lors de l'insertion
    console.error('Erreur ajout favori:', err);
    res.status(500).json({ error: 'Erreur serveur' });
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

// Récupérer tous les favoris d’un utilisateur avec images
router.get('/favorites/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Requête pour récupérer les livres favoris avec leurs images
    const query = `
      SELECT 
        b.*,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) FROM book_images WHERE book_id = b.id) AS images
      FROM favorites f
      JOIN book b ON f.book_id = b.id
      WHERE f.user_id = ?
      GROUP BY b.id
    `;

    const [rows] = await pool.query(query, [userId]);

    // Formatage des images sous forme de tableau d'URLs accessibles
    const favorites = rows.map(row => ({
      ...row,
      images: row.images
        ? row.images
            .split(',')
            .map(img => `/uploads/${img.trim()}`)
            .filter(img => img !== '/uploads/')
        : []
    }));

    res.status(200).json(favorites);
  } catch (err) {
    // Gestion des erreurs serveur lors de la récupération
    console.error('Erreur récupération favoris:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
