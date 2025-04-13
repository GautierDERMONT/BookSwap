const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const authenticate = require('../middlewares/authenticate');

// GET tous les livres
router.get('/', async (req, res) => {
  try {
    const [books] = await pool.query(`
      SELECT b.*, u.email as owner_email 
      FROM books b
      JOIN users u ON b.user_id = u.id
    `);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET un livre par ID
router.get('/:id', async (req, res) => {
  try {
    const [books] = await pool.query(`
      SELECT b.*, u.email as owner_email 
      FROM books b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [req.params.id]);
    
    if (books.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json(books[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST créer un livre (protégé)
router.post('/', authenticate, async (req, res) => {
  const { title, author, condition, description } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO books (title, author, condition, description, user_id) VALUES (?, ?, ?, ?, ?)',
      [title, author, condition, description, req.userId]
    );
    
    const [newBook] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(newBook[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE supprimer un livre (protégé)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Vérifier que le livre appartient à l'utilisateur
    const [books] = await pool.query('SELECT user_id FROM books WHERE id = ?', [req.params.id]);
    
    if (books.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    if (books[0].user_id !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;