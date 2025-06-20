const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');

class Book {
  static async create(bookData, userId) {
    const query = `
      INSERT INTO book 
        (title, author, category, \`condition\`
        , location, description, availability,
         users_id, created_at) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      bookData.title.trim(),
      bookData.author.trim(),
      bookData.category.trim(),
      bookData.condition.trim(),
      bookData.location.trim(),
      bookData.description?.trim() || null,
      bookData.availability.trim(),
      userId,
      new Date().toISOString().slice(0, 19).replace('T', ' ')
    ];

    const [result] = await pool.query(query, params);
    return result.insertId;
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
        b.created_at,
        b.availability,
        GROUP_CONCAT(bi.image_path ORDER BY bi.id ASC) AS images
      FROM book b
      LEFT JOIN book_images bi ON b.id = bi.book_id
      GROUP BY b.id
    `;

    const [rows] = await pool.query(query);
    return rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',').filter(img => img !== null) : []
    }));
  }

  static async delete(bookId, userId) {
    const [book] = await pool.query('SELECT users_id FROM book WHERE id = ?', [bookId]);
    
    if (!book || book.length === 0) {
      throw new Error('Livre non trouvé');
    }

    if (book[0].users_id !== userId) {
      throw new Error('Non autorisé');
    }

    const [images] = await pool.query('SELECT image_path FROM book_images WHERE book_id = ?', [bookId]);
    
    await pool.query('START TRANSACTION');
    try {
      await pool.query('DELETE FROM book_images WHERE book_id = ?', [bookId]);
      await pool.query('DELETE FROM book WHERE id = ?', [bookId]);
      await pool.query('COMMIT');
      
      images.forEach(img => {
        const fullPath = path.join(__dirname, '../uploads', path.basename(img.image_path));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
      
      return true;
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }
}

module.exports = Book;