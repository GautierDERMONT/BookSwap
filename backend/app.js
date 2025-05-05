const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const messagesRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api', messagesRoutes);

app.use((req, res, next) => {
  console.log(`📩 Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  console.error('❌ Middleware error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}


module.exports = app;