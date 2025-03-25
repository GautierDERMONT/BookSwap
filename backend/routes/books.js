// backend/routes/books.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET tous les livres
router.get('/', async (req, res) => {
  try {
    const [books] = await pool.query('SELECT * FROM books');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;