const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { initSocket } = require('./socket');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Type'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const messagesRoutes = require('./routes/messages');
const favoritesRoutes = require('./routes/favorites');

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api', messagesRoutes);
app.use('/api', favoritesRoutes);

app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const server = http.createServer(app);
initSocket(server);

module.exports = server;