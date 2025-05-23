const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const router = express.Router();
const multer = require('multer');

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `temp_${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const authenticate = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000
    }).json({
      userId: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token').json({ message: "Déconnexion réussie" });
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [req.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, location, bio FROM users WHERE id = ?',
      [req.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  const { username, location, bio, currentPassword, newPassword } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }

      const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
      const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
      
      if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await pool.query(
        'UPDATE users SET username = ?, location = ?, bio = ?, password_hash = ? WHERE id = ?',
        [username, location, bio, hashedPassword, req.userId]
      );
    } else {
      await pool.query(
        'UPDATE users SET username = ?, location = ?, bio = ? WHERE id = ?',
        [username, location, bio, req.userId]
      );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No avatar file uploaded" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `avatar_${req.userId}${ext}`;
    const filePath = path.join(__dirname, '../uploads', fileName);

    const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.userId]);
    if (users[0].avatar) {
      const oldAvatarPath = path.join(__dirname, '../uploads', path.basename(users[0].avatar));
      if (fs.existsSync(oldAvatarPath) && oldAvatarPath !== req.file.path) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    if (req.file.path !== filePath) {
      fs.renameSync(req.file.path, filePath);
    }
    
    await pool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [`/uploads/${fileName}`, req.userId]
    );
    
    res.json({ 
      message: "Avatar updated successfully",
      avatarUrl: `/uploads/${fileName}`
    });
  } catch (err) {
    console.error('Avatar update error:', err);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: "Failed to update avatar",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.delete('/avatar', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.userId]);
    if (users[0].avatar) {
      const avatarPath = path.join(__dirname, '../uploads', path.basename(users[0].avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await pool.query(
      'UPDATE users SET avatar = NULL WHERE id = ?',
      [req.userId]
    );
    
    res.json({ message: "Avatar deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile/:userId', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, avatar, location, bio FROM users WHERE id = ?',
      [req.params.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;