const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuration CORS pour autoriser le frontend sur localhost:5173
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Middlewares pour parser cookies, JSON et données URL-encodées
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Servir les fichiers statiques uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import des routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const messagesRoutes = require('./routes/messages');
const favoritesRoutes = require('./routes/favorites');

// Déclaration des routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api', messagesRoutes);
app.use('/api', favoritesRoutes);

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Création du dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

module.exports = app;
