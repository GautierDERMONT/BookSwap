const db = require('../config/db');

class Book {
  static async create(bookData, userId) {
    const query = `
      INSERT INTO book 
        (title, category, \`condition\`, location, description, user_id) 
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
      const [result] = await db.query(query, params);
      return result.insertId;
    } catch (err) {
      console.error('SQL Error:', err);
      throw err;
    }
  }

  static async addImages(bookId, images) {
    const queries = images.map(image => 
      db.query(
        'INSERT INTO book_images (book_id, image_path) VALUES (?, ?)',
        [bookId, image.path]
      )
    );
    await Promise.all(queries);
  }
}

module.exports = Book;