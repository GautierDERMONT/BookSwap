const { pool } = require('../config/db'); // Connexion à la base de données via pool

// Objet Favorites gérant l'ajout, suppression et récupération des favoris d'un utilisateur
const Favorites = {

  // Ajoute un livre aux favoris d'un utilisateur
  add: async (userId, bookId) => {
    const sql = 'INSERT INTO favorites (user_id, book_id) VALUES (?, ?)';
    try {
      const [result] = await pool.query(sql, [userId, bookId]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Supprime un livre des favoris d'un utilisateur
  remove: async (userId, bookId) => {
    const sql = 'DELETE FROM favorites WHERE user_id = ? AND book_id = ?';
    try {
      const [result] = await pool.query(sql, [userId, bookId]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Récupère tous les livres favoris d'un utilisateur donné
  getUserFavorites: async (userId) => {
    const sql = `
      SELECT book.*
      FROM favorites
      JOIN book ON favorites.book_id = book.id
      WHERE favorites.user_id = ?
    `;
    try {
      const [rows] = await pool.query(sql, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Favorites;
