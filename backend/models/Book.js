const { pool } = require('../config/db');

class Book {
  static async create(bookData, userId) {
    const query = `
      INSERT INTO book 
        (title, author, category, \`condition\`, location, description, users_id) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      bookData.title.trim(),
      bookData.author.trim(), // Bien inclus maintenant
      bookData.category.trim(),
      bookData.condition.trim(),
      bookData.location.trim(),
      bookData.description?.trim() || null,
      userId
    ];

    try {
      const [result] = await pool.query(query, params);
      return result.insertId;
    } catch (err) {
      console.error('SQL Error:', err);
      throw err;
    }
  }

  static async addImages(bookId, images) {
    const queries = images.map(image => 
      pool.query(
        'INSERT INTO book_images (book_id, image_path) VALUES (?, ?)',
        [bookId, image.path]
      )
    );
    await Promise.all(queries);
  }

  static async getAllBooks() {
    const query = `
      SELECT 
        b.id, 
        b.title, 
        b.author,
        b.category, 
        b.users_id, 
        b.location, 
        b.condition,
        b.description,
        GROUP_CONCAT(bi.image_path ORDER BY bi.id ASC) AS images
      FROM book b
      LEFT JOIN book_images bi ON b.id = bi.book_id
      GROUP BY b.id
    `;
  
    try {
      const [rows] = await pool.query(query);
      return rows.map(row => ({
        ...row,
        images: row.images ? row.images.split(',').filter(img => img !== null) : []
      }));
    } catch (err) {
      console.error('Erreur SQL:', err);
      throw err;
    }
  }
}

module.exports = Book;
