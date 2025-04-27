const express = require('express');
const multer = require('multer');
const path = require('path');
const Book = require('../models/Book');
const authenticate = require('../middleware/authenticate');

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

    const { title, category, condition, location, description } = req.body;

    // Validation des champs obligatoires
    if (!title || !category || !condition || !location || !description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis, y compris la description' });
    }

    // Création du livre dans la base de données
    const bookId = await Book.create({
      title: title.trim(),
      category: category.trim(),
      condition: condition.trim(),
      location: location.trim(),
      description: description.trim() || null
    }, req.userId);

    // Ajout des images si elles existent
    if (req.files && req.files.length > 0) {
      const images = req.files.map(file => ({
        path: file.filename
      }));
      await Book.addImages(bookId, images);
    }

    // Réponse de succès
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
        // Supprime tout chemin existant et reconstruit proprement
        const filename = path.basename(img);
        return `/uploads/${filename}`;
      }).filter(img => img !== '/uploads/') // Filtre les chemins vides
    }));
    res.json({ books: booksWithImageUrls });
  } catch (err) {
    console.error('Erreur lors de la récupération des livres:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
