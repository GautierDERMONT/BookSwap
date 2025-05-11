const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware de base
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const messagesRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api', messagesRoutes);

// Logging middleware
app.use((req, res, next) => {
  console.log(`📩 Incoming request: ${req.method} ${req.url}`);
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Middleware error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

module.exports = app;