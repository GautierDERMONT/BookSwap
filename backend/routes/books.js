const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const authenticate = require('../middleware/authenticate');
const { pool } = require('../config/db');

const router = express.Router();

// Création du dossier upload s'il n'existe pas
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage Multer (destination + nom fichier)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Configuration Multer : stockage, filtre mime, limites (taille, nb fichiers)
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
    fileSize: 10 * 1024 * 1024, // 10MB max par fichier
    files: 3                    // max 3 fichiers
  }
});

// Route POST pour création d'un livre avec images (authentification requise)
router.post('/', authenticate, upload.array('images', 3), async (req, res) => {
  try {
    // Vérification présence des fichiers images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Au moins une image est requise' });
    }

    // Vérification des champs obligatoires dans le corps de la requête
    const { title, author, category, condition, location, description, availability } = req.body;
    if (!title || !author || !category || !condition || !location || !description || !availability) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Création du livre en base via le modèle
    const bookId = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      condition: condition.trim(),
      location: location.trim(),
      description: description.trim(),
      availability: availability.trim()
    }, req.userId);

    // Préparation des images pour insertion en base
    const images = req.files.map(file => ({
      path: file.filename
    }));
    
    // Ajout des images liées au livre en base
    await Book.addImages(bookId, images);

    // Réponse succès création
    res.status(201).json({
      success: true,
      bookId: bookId,
      message: 'Livre ajouté avec succès'
    });

  } catch (error) {
    // Gestion des erreurs serveur
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route GET pour recherche de livres avec filtres
router.get('/search', async (req, res) => {
  try {
    const { q: query = '', location, condition, genre } = req.query;
    
    // Construction dynamique de la requête SQL
    let sql = `
      SELECT 
        b.*, 
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) 
         FROM book_images 
         WHERE book_id = b.id) as images
      FROM book b
      WHERE 1=1
    `;
    
    const params = [];
    
    // Ajout du filtre recherche sur titre ou auteur
    if (query) {
      sql += ' AND (b.title LIKE ? OR b.author LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }
    
    // Ajout filtre sur localisation
    if (location) {
      sql += ' AND b.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    // Ajout filtre sur état du livre
    if (condition) {
      sql += ' AND b.condition = ?';
      params.push(condition);
    }
    
    // Ajout filtre sur catégorie (genre)
    if (genre) {
      sql += ' AND b.category = ?';
      params.push(genre);
    }
    
    sql += ' GROUP BY b.id';
    
    // Exécution de la requête avec paramètres
    const [rows] = await pool.query(sql, params);

    // Formatage des résultats : séparation des images en tableau
    const books = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',').filter(img => img !== '/uploads/') : []
    }));

    res.json({ books });
  } catch (err) {
    // Gestion des erreurs lors de la recherche
    console.error('Search error:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// Route GET pour suggestions auto-complétion (titre/auteur)
router.get('/suggestions', async (req, res) => {
  try {
    const query = req.query.q || '';
    // Minimum 3 caractères pour lancer la recherche
    if (query.length < 3) {
      return res.json({ suggestions: [] });
    }

    const searchQuery = `%${query}%`;
    // Recherche titres distincts correspondant
    const [titles] = await pool.query(
      'SELECT DISTINCT title FROM book WHERE title LIKE ? LIMIT 5',
      [searchQuery]
    );
    // Recherche auteurs distincts correspondant
    const [authors] = await pool.query(
      'SELECT DISTINCT author FROM book WHERE author LIKE ? LIMIT 5',
      [searchQuery]
    );

    // Concaténation des résultats et limitation à 5 suggestions
    const suggestions = [
      ...titles.map(t => t.title),
      ...authors.map(a => a.author)
    ].slice(0, 5);

    res.json({ suggestions });
  } catch (err) {
    // Gestion erreur récupération suggestions
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des suggestions' });
  }
});

// Route GET liste de tous les livres (avec images formatées)
router.get('/', async (req, res) => {
  try {
    const books = await Book.getAllBooks();
    // Formatage URLs images pour accès via /uploads
    const booksWithImageUrls = books.map(book => ({
      ...book,
      images: book.images.map(img => {
        const filename = path.basename(img);
        return `/uploads/${filename}`;
      }).filter(img => img !== '/uploads/')
    }));
    res.json({ books: booksWithImageUrls });
  } catch (err) {
    // Gestion erreur récupération livres
    console.error('Erreur lors de la récupération des livres:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route DELETE pour suppression d'un livre (auth + propriétaire)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.userId;

    // Récupération du livre avec infos utilisateur
    const [book] = await pool.query(`
      SELECT b.*, u.username, u.avatar 
      FROM book b
      JOIN users u ON b.users_id = u.id
      WHERE b.id = ?
    `, [bookId]);
    
    // Vérification existence du livre
    if (!book || book.length === 0) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    // Vérification que l'utilisateur est propriétaire du livre
    if (book[0].users_id !== userId) {
      return res.status(403).json({ error: 'Non autorisé - Vous n\'êtes pas le propriétaire de ce livre' });
    }

    // Récupération des images liées au livre
    const [images] = await pool.query(
      'SELECT image_path FROM book_images WHERE book_id = ?',
      [bookId]
    );

    // Suppression des fichiers images sur disque
    images.forEach(image => {
      if (image.image_path) {
        const filename = path.basename(image.image_path);
        const fullPath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    });

    // Suppression des images en base
    await pool.query('DELETE FROM book_images WHERE book_id = ?', [bookId]);
    // Suppression du livre en base
    await pool.query('DELETE FROM book WHERE id = ?', [bookId]);

    res.json({ success: true, message: 'Livre et images supprimés avec succès' });
  } catch (err) {
    // Gestion erreur suppression
    console.error('Erreur lors de la suppression:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du livre',
      details: err.message 
    });
  }
});

// Route GET pour récupérer un livre spécifique avec utilisateur et images
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

    // Vérification existence du livre
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    // Construction de l'objet livre complet avec images et info utilisateur
    const book = {
      ...rows[0],
      images: rows[0].images ? rows[0].images.split(',') : [],
      user: {
        id: rows[0].user_id,
        username: rows[0].username,
        email: rows[0].email
      }
    };

    res.json({ book });
    
  } catch (err) {
    // Gestion erreur SQL
    console.error('Erreur SQL:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
});

// Route PUT pour modification d'un livre avec images (auth + propriétaire)
router.put('/:id', authenticate, upload.array('images', 3), async (req, res) => {
  try {
    const { title, author, category, condition, location, description, availability } = req.body;
    const bookId = req.params.id;
    const userId = req.userId;

    // Vérification existence et propriété du livre
    const [book] = await pool.query('SELECT users_id FROM book WHERE id = ?', [bookId]);
    
    if (!book || book.length === 0) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    if (book[0].users_id !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Mise à jour des données du livre en base
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

    // Récupération des images existantes que l'utilisateur souhaite garder
    const existingImages = req.body.existingImages 
      ? Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : [req.body.existingImages]
      : [];

    // Récupération des images actuelles en base
    const [currentImages] = await pool.query(
      'SELECT image_path FROM book_images WHERE book_id = ?',
      [bookId]
    );

    // Suppression des images supprimées par l'utilisateur
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

    // Ajout des nouvelles images uploadées
    if (req.files && req.files.length > 0) {
      const images = req.files.map(file => ({ path: file.filename }));
      await Book.addImages(bookId, images);
    }

    res.json({ success: true, message: 'Livre mis à jour avec succès' });
  } catch (err) {
    // Gestion erreur modification
    console.error('Erreur lors de la modification:', err);
    res.status(500).json({ error: 'Erreur lors de la modification du livre' });
  }
});

// Route GET liste livres avec possibilité filtrage par userId
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

    // Exécution requête avec ou sans filtre userId
    const [rows] = await pool.query(query, params);

    // Formatage images avec chemins d'accès
    const books = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',').map(img => `/uploads/${path.basename(img)}`).filter(img => img !== '/uploads/') : []
    }));

    res.json({ books });
  } catch (err) {
    // Gestion erreur récupération liste livres
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Error fetching books' });
  }
});

// Route GET liste livres d'un utilisateur spécifique
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

    // Formatage images pour chaque livre
    const books = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',').map(img => `/uploads/${path.basename(img)}`).filter(img => img !== '/uploads/') : []
    }));

    res.json({ books });
  } catch (err) {
    // Gestion erreur récupération livres utilisateur
    console.error('Error fetching user books:', err);
    res.status(500).json({ error: 'Error fetching user books' });
  }
});

module.exports = router;
