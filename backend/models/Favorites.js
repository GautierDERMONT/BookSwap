const { pool } = require('../config/db'); // Chemin relatif à ajuster selon ton arborescence

const Favorites = {
  add: async (userId, bookId) => {
    const sql = 'INSERT INTO favorites (user_id, book_id) VALUES (?, ?)';
    try {
      const [result] = await pool.query(sql, [userId, bookId]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  remove: async (userId, bookId) => {
    const sql = 'DELETE FROM favorites WHERE user_id = ? AND book_id = ?';
    try {
      const [result] = await pool.query(sql, [userId, bookId]);
      return result;
    } catch (error) {
      throw error;
    }
  },

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
