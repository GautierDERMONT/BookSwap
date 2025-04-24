const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware spécial pour multipart/form-data
app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    // Laissez multer gérer ce type de contenu
    next();
  } else {
    express.json()(req, res, next);
  }
});

// CORS
app.use(cors({
  origin: 'http://localhost:5173', // ton frontend
  credentials: true
}));

// Servir les fichiers statiques (uploads d'images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books'); // <-- 👈 ICI on ajoute la route pour les livres

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes); // <-- Et on la "monte"

// Logging (optionnel)
app.use((req, res, next) => {
  console.log(`📩 Incoming request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Middleware error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Créer le dossier uploads s’il n’existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

module.exports = app;
