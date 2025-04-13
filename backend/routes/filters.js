const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET toutes les localisations disponibles
router.get('/locations', async (req, res) => {
  try {
    // À adapter selon votre modèle de données
    const [locations] = await pool.query('SELECT DISTINCT location FROM books WHERE location IS NOT NULL');
    res.json(locations.map(l => l.location));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET toutes les catégories disponibles
router.get('/categories', async (req, res) => {
  try {
    // À adapter selon votre modèle de données
    const [categories] = await pool.query('SELECT DISTINCT category FROM books WHERE category IS NOT NULL');
    res.json(categories.map(c => c.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;