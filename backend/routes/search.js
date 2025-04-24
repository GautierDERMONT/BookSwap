const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.get('/', async (req, res) => {
  const { q, location, category, condition } = req.query;
  
  let query = `
    SELECT b.*, u.email as owner_email 
    FROM books b
    JOIN users u ON b.users_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (q) {
    query += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)';
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (condition) {
    query += ' AND b.condition = ?';
    params.push(condition);
  }
  
  // Ajoutez des filtres supplémentaires pour location/category si nécessaire
  
  try {
    const [books] = await pool.query(query, params);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;