const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const router = express.Router();
const multer = require('multer');

// Configuration du stockage des avatars avec multer
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });  // Création du dossier uploads si inexistant
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `temp_${Date.now()}${ext}`);  // Nom temporaire unique
  }
});

// Initialisation multer avec filtres et limites de taille
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
    fileSize: 5 * 1024 * 1024 // Limite à 5 Mo
  }
});

// Middleware d'authentification basé sur JWT
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

// Route d'inscription d'un nouvel utilisateur
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

// Route de connexion utilisateur, renvoie un JWT en cookie
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
      process.env.JWT_SECRET,
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

// Route de déconnexion (suppression du cookie JWT)
router.post('/logout', (req, res) => {
  res.clearCookie('token').json({ message: "Déconnexion réussie" });
});

// Route pour récupérer les infos de l'utilisateur connecté (sans données sensibles)
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

// Route pour récupérer le profil complet (avec bio et localisation)
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

// Route pour modifier le profil utilisateur (avec option changement de mot de passe)
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

// Route pour mettre à jour l'avatar (upload + renommage + suppression ancien avatar)
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

// Route pour supprimer l'avatar de l'utilisateur
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

// Route pour récupérer le profil d'un utilisateur par son ID (publique)
router.get('/profile/:userId', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, location, bio FROM users WHERE id = ?', // Ajout de email
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

// Route pour supprimer le compte utilisateur avec nettoyage complet (transactions)
router.delete('/account', authenticate, async (req, res) => {
  try {
    await pool.query('START TRANSACTION');

    // 1. Supprimer les images associées aux livres de l'utilisateur
    const [userBooks] = await pool.query('SELECT id FROM book WHERE users_id = ?', [req.userId]);
    const bookIds = userBooks.map(book => book.id);

    if (bookIds.length > 0) {
      const [bookImages] = await pool.query('SELECT image_path FROM book_images WHERE book_id IN (?)', [bookIds]);
      
      bookImages.forEach(image => {
        const imagePath = path.join(__dirname, '../uploads', path.basename(image.image_path));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });

      await pool.query('DELETE FROM book_images WHERE book_id IN (?)', [bookIds]);
    }

    // 2. Supprimer les messages de l'utilisateur
    await pool.query('DELETE FROM messages WHERE sender_id = ?', [req.userId]);

    // 3. Supprimer les conversations impliquant l'utilisateur
    await pool.query('DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?', [req.userId, req.userId]);

    // 4. Supprimer les favoris de l'utilisateur
    await pool.query('DELETE FROM favorites WHERE user_id = ?', [req.userId]);

    // 5. Supprimer les livres de l'utilisateur
    await pool.query('DELETE FROM book WHERE users_id = ?', [req.userId]);

    // 6. Supprimer l'avatar de l'utilisateur s'il existe
    const [user] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.userId]);
    if (user[0].avatar) {
      const avatarPath = path.join(__dirname, '../uploads', path.basename(user[0].avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // 7. Supprimer le compte utilisateur
    await pool.query('DELETE FROM users WHERE id = ?', [req.userId]);

    await pool.query('COMMIT');

    res.clearCookie('token').json({ message: "Compte supprimé avec succès" });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error deleting account:', err);
    res.status(500).json({ error: "Erreur lors de la suppression du compte" });
  }
});

module.exports = router;