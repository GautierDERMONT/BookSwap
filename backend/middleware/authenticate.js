const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    if (!decoded.userId) {
      console.error('Token missing userId');
      return res.status(401).json({ error: "Invalid token structure" });
    }

    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      console.error('User not found for ID:', decoded.userId);
      return res.status(401).json({ error: "User not found" });
    }

    req.userId = decoded.userId;
    next();

  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ 
      error: "Authentication failed",
      details: err.message
    });
  }
};