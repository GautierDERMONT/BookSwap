// Importation des modules nécessaires : JWT pour la vérification de token, pool MySQL pour interroger la base
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Middleware d'authentification à utiliser dans les routes protégées
module.exports = async (req, res, next) => {
  try {
    // Récupération du token depuis les cookies ou l'en-tête Authorization
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    // Si aucun token n'est présent, renvoyer une erreur 401
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: "Authentication required" });
    }

    // Autorise l'accès à certains chemins publics sans vérification du token
    if (req.path.startsWith('/uploads/') || req.path.startsWith('/default-avatar.png')) {
      return next();
    }

    // Vérification et décodage du token avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    // Vérifie que le token contient un userId valide
    if (!decoded.userId) {
      console.error('Token missing userId');
      return res.status(401).json({ error: "Invalid token structure" });
    }

    // Vérifie que l'utilisateur existe bien en base de données
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [decoded.userId]);
    
    // Si aucun utilisateur correspondant, renvoie une erreur 401
    if (users.length === 0) {
      console.error('User not found for ID:', decoded.userId);
      return res.status(401).json({ error: "User not found" });
    }

    // Ajout de l'ID utilisateur à l'objet request pour les prochains middlewares
    req.userId = decoded.userId;
    next();

  } catch (err) {
    // Gestion des erreurs (token invalide, expiré, etc.)
    console.error('Authentication error:', err.message);
    res.status(401).json({ 
      error: "Authentication failed",
      details: err.message
    });
  }
};
