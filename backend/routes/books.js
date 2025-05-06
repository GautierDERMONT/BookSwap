const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const authenticate = require('../middleware/authenticate');
const { pool } = require('../config/db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Route pour ajouter un livre
router.post('/', authenticate, upload.array('images', 3), async (req, res) => {
  try {
    console.log('Données reçues:', {
      body: req.body,
      files: req.files?.map(f => f.filename),
      userId: req.userId
    });

    const { title, author, category, condition, location, description } = req.body;

    if (!title || !author || !category || !condition || !location || !description) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const bookId = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      condition: condition.trim(),
      location: location.trim(),
      description: description.trim()
    }, req.userId);

    if (req.files && req.files.length > 0) {
      const images = req.files.map(file => ({
        path: file.filename
      }));
      await Book.addImages(bookId, images);
    }

    res.status(201).json({
      success: true,
      bookId: bookId,
      message: 'Livre ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du livre:', error);
    res.status(500).json({
      error: error.message || 'Erreur lors de l\'ajout du livre'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const books = await Book.getAllBooks();
    const booksWithImageUrls = books.map(book => ({
      ...book,
      images: book.images.map(img => {
        const filename = path.basename(img);
        return `/uploads/${filename}`;
      }).filter(img => img !== '/uploads/')
    }));
    res.json({ books: booksWithImageUrls });
  } catch (err) {
    console.error('Erreur lors de la récupération des livres:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour supprimer un livre
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.userId;

    // 1. Récupérer les informations du livre et ses images
    const [book] = await pool.query(`
      SELECT b.users_id, GROUP_CONCAT(bi.image_path) as images 
      FROM book b
      LEFT JOIN book_images bi ON b.id = bi.book_id
      WHERE b.id = ?
      GROUP BY b.id
    `, [bookId]);
    
    if (!book || book.length === 0) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    if (book[0].users_id !== userId) {
      return res.status(403).json({ error: 'Non autorisé - Vous n\'êtes pas le propriétaire de ce livre' });
    }

    // 2. Supprimer les images physiques
    if (book[0].images) {
      const images = book[0].images.split(',');
      images.forEach(imagePath => {
        if (imagePath) {
          const filename = path.basename(imagePath);
          const fullPath = path.join(__dirname, '../uploads', filename);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      });
    }

    // 3. Supprimer les entrées en base de données
    await pool.query('DELETE FROM book_images WHERE book_id = ?', [bookId]);
    await pool.query('DELETE FROM book WHERE id = ?', [bookId]);

    res.json({ success: true, message: 'Livre et images supprimés avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du livre',
      details: err.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching book with ID:', req.params.id); // Log l'ID reçu

    const query = `
      SELECT 
        b.*, 
        u.id as user_id, 
        u.username,
        u.email,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) FROM book_images WHERE book_id = b.id) as images
      FROM book b
      LEFT JOIN users u ON b.users_id = u.id
      WHERE b.id = ?
    `;

    const [rows] = await pool.query(query, [req.params.id]);
    console.log('Query results:', rows); // Log les résultats

    if (!rows || rows.length === 0) {
      console.log('No book found with ID:', req.params.id);
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    const book = {
      ...rows[0],
      images: rows[0].images ? rows[0].images.split(',') : [],
      user: {
        id: rows[0].user_id,
        username: rows[0].username,
        email: rows[0].email
      }
    };

    console.log('Formatted book:', book); // Log le livre formaté
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
    const { title, author, category, condition, location, description } = req.body;
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
        description = ? 
       WHERE id = ?`,
      [title, author, category, condition, location, description, bookId]
    );

    const existingImages = req.body.existingImages 
      ? Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : [req.body.existingImages]
      : [];

    // Suppression des images physiques qui ne sont plus utilisées
    const [currentImages] = await pool.query(
      'SELECT image_path FROM book_images WHERE book_id = ?',
      [bookId]
    );

    currentImages.forEach(async (img) => {
      if (!existingImages.includes(img.image_path)) {
        const fullPath = path.join(__dirname, '../uploads', path.basename(img.image_path));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
        await pool.query(
          'DELETE FROM book_images WHERE book_id = ? AND image_path = ?',
          [bookId, img.image_path]
        );
      }
    });

    if (req.files && req.files.length > 0) {
      const images = req.files.map(file => ({ path: file.filename }));
      await Book.addImages(bookId, images);
    }

    res.json({ success: true, message: 'Livre mis à jour avec succès' });
  } catch (err) {
    console.error('Erreur lors de la modification:', err);
    res.status(500).json({ error: 'Erreur lors de la modification du livre' });
  }
});

module.exports = router;