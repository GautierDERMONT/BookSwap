const { pool } = require('../config/db');

class Book {
  static async create(bookData, userId) {
    const query = `
      INSERT INTO book 
        (title, category, \`condition\`, location, description, users_id) 
      VALUES 
        (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      bookData.title.trim(),
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
        book.id, 
        book.title, 
        book.category, 
        book.users_id, 
        book.location, 
        book.condition,
        book_images.image_path AS image_url
      FROM book
      LEFT JOIN book_images ON book.id = book_images.book_id
    `;
  
    try {
      const [rows] = await pool.query(query);
      return rows;
    } catch (err) {
      console.error('Erreur SQL:', err);
      throw err;
    }
  }
  
}

module.exports = Book;
