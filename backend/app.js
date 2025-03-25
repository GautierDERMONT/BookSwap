// backend/app.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const booksRouter = require('./routes/books');
app.use('/api/books', booksRouter); 


app.get('/', (req, res) => {
  res.send('API BookSwap is running!');
});

module.exports = app;