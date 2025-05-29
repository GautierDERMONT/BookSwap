const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares pour parser cookies, JSON et données URL-encodées
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS pour autoriser le frontend sur localhost:5173
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));

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


// Pour Vercel/Netlify - Servir le frontend si les routes API ne sont pas trouvées
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}
module.exports = app;
