const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const searchRoutes = require('./routes/search');
const filterRoutes = require('./routes/filters');

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/filters', filterRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});