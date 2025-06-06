const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const authenticate = require('../middleware/authenticate');
const { pool } = require('../config/db');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  },
  limits: { 
    fileSize: 20 * 1024 * 1024,
    files: 3
  }
});

router.post('/', authenticate, upload.array('images', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Au moins une image est requise' });
    }

    const { title, author, category, condition, location, description, availability } = req.body;
    if (!title || !author || !category || !condition || !location || !description || !availability) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const bookId = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      condition: condition.trim(),
      location: location.trim(),
      description: description.trim(),
      availability: availability.trim()
    }, req.userId);

    const images = req.files.map(file => ({
      path: `/uploads/${file.filename}`
    }));
    
    await Book.addImages(bookId, images);

    res.status(201).json({
      success: true,
      bookId: bookId,
      message: 'Livre ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q: query = '', location, condition, genre } = req.query;
    
    let sql = `
      SELECT 
        b.*, 
        u.id as user_id,
        u.username,
        u.avatar,
        u.email,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) 
        FROM book_images 
        WHERE book_id = b.id) as images
      FROM book b
      LEFT JOIN users u ON b.users_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (query) {
      sql += ' AND (b.title LIKE ? OR b.author LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }
    
    if (location) {
      sql += ' AND b.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    if (condition) {
      sql += ' AND b.condition = ?';
      params.push(condition);
    }
    
    if (genre) {
      sql += ' AND b.category = ?';
      params.push(genre);
    }
    
    sql += ' GROUP BY b.id';
    
    const [rows] = await pool.query(sql, params);

    const books = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',').filter(img => img !== '/uploads/') : []
    }));

    res.json({ books });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (query.length < 3) {
      return res.json({ suggestions: [] });
    }

    const searchQuery = `%${query}%`;
    const [titles] = await pool.query(
      'SELECT DISTINCT title FROM book WHERE title LIKE ? LIMIT 5',
      [searchQuery]
    );
    const [authors] = await pool.query(
      'SELECT DISTINCT author FROM book WHERE author LIKE ? LIMIT 5',
      [searchQuery]
    );

    const suggestions = [
      ...titles.map(t => t.title),
      ...authors.map(a => a.author)
    ].slice(0, 5);

    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des suggestions' });
  }
});

router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT 
        b.*, 
        u.username,
        u.avatar,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) FROM book_images WHERE book_id = b.id) as images
      FROM book b
      LEFT JOIN users u ON b.users_id = u.id
      ${req.query.userId ? 'WHERE b.users_id = ?' : ''}
      GROUP BY b.id
    `;

    const params = req.query.userId ? [req.query.userId] : [];

    const [rows] = await pool.query(query, params);

    const books = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',').map(img => `/uploads/${path.basename(img)}`).filter(img => img !== '/uploads/') : []
    }));

    res.json({ books });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Error fetching books' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*, 
        u.username,
        u.avatar,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) FROM book_images WHERE book_id = b.id) as images
      FROM book b
      LEFT JOIN users u ON b.users_id = u.id
      WHERE b.users_id = ?
      GROUP BY b.id
    `;

    const [rows] = await pool.query(query, [req.params.userId]);

    const books = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',').map(img => `/uploads/${path.basename(img)}`).filter(img => img !== '/uploads/') : []
    }));

    res.json({ books });
  } catch (err) {
    console.error('Error fetching user books:', err);
    res.status(500).json({ error: 'Error fetching user books' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*, 
        u.id as user_id, 
        u.username,
        u.avatar,  
        u.email,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) FROM book_images WHERE book_id = b.id) as images
      FROM book b
      LEFT JOIN users u ON b.users_id = u.id
      WHERE b.id = ?
    `;

    const [rows] = await pool.query(query, [req.params.id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    const book = {
      ...rows[0],
      images: rows[0].images 
        ? rows[0].images.split(',').map(img => {
            if (!img.startsWith('/uploads/')) {
              return `/uploads/${img}`;
            }
            return img;
          })
        : [],
      user: {
        id: rows[0].user_id,
        username: rows[0].username,
        email: rows[0].email
      }
    };

    res.json({ book });
  } catch (err) {
    console.error('Erreur SQL:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
});

router.put('/:id', authenticate, upload.array('images', 3), async (req, res) => {
  try {
    const { title, author, category, condition, location, description, availability } = req.body;
    const bookId = req.params.id;
    const userId = req.userId;

    const [book] = await pool.query('SELECT users_id FROM book WHERE id = ?', [bookId]);
    
    if (!book || book.length === 0) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    if (book[0].users_id !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await pool.query(
      `UPDATE book SET 
        title = ?, 
        author = ?, 
        category = ?, 
        \`condition\` = ?, 
        location = ?, 
        description = ?,
        availability = ?
      WHERE id = ?`,
      [title, author, category, condition, location, description, availability, bookId]
    );

    // Récupérer toutes les images existantes envoyées depuis le frontend
    const existingImages = Array.isArray(req.body.existingImages) 
      ? req.body.existingImages 
      : req.body.existingImages 
        ? [req.body.existingImages] 
        : [];

    // Récupérer les images actuelles de la base de données
    const [currentImages] = await pool.query(
      'SELECT image_path FROM book_images WHERE book_id = ?',
      [bookId]
    );

    // Identifier les images à supprimer (celles qui ne sont plus dans existingImages)
    const imagesToDelete = currentImages.filter(
      img => !existingImages.includes(img.image_path)
    );

    // Supprimer les images physiquement et de la base de données
    for (const img of imagesToDelete) {
      const imageName = path.basename(img.image_path);
      const fullPath = path.join(__dirname, '../uploads', imageName);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      await pool.query(
        'DELETE FROM book_images WHERE book_id = ? AND image_path = ?',
        [bookId, img.image_path]
      );
    }

    // Ajouter les nouvelles images
    if (req.files && req.files.length > 0) {
      const images = req.files.map(file => ({ 
        path: `/uploads/${file.filename}` 
      }));
      await Book.addImages(bookId, images);
    }

    res.json({ success: true, message: 'Livre mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur lors de la modification:', err);
    res.status(500).json({ error: 'Erreur lors de la modification du livre' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.userId;

    await Book.delete(bookId, userId);

    res.json({ 
      success: true, 
      message: 'Livre supprimé avec succès' 
    });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    
    if (err.message === 'Livre non trouvé') {
      return res.status(404).json({ error: err.message });
    }
    
    if (err.message === 'Non autorisé') {
      return res.status(403).json({ error: err.message });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du livre',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;