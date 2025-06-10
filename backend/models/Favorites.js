const { pool } = require('../config/db');

const Favorites = {
  checkExisting: async (userId, bookId) => {
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );
    return existing.length > 0;
  },

  add: async (userId, bookId) => {
    await pool.query(
      'INSERT INTO favorites (user_id, book_id) VALUES (?, ?)',
      [userId, bookId]
    );
  },

  remove: async (userId, bookId) => {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );
  },

  getUserFavorites: async (userId) => {
    const query = `
      SELECT 
        b.*,
        u.id as user_id,
        u.username,
        u.avatar,
        (SELECT GROUP_CONCAT(image_path ORDER BY id ASC) FROM book_images WHERE book_id = b.id) AS images
      FROM favorites f
      JOIN book b ON f.book_id = b.id
      JOIN users u ON b.users_id = u.id
      WHERE f.user_id = ?
      GROUP BY b.id
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows.map(row => ({
      ...row,
      images: row.images 
        ? row.images.split(',').map(img => `/uploads/${img.trim().replace(/^\/uploads\//, '')}`).filter(img => img !== '/uploads/') 
        : []
    }));
  }
};

module.exports = Favorites;