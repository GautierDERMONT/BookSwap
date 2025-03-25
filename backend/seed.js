// backend/seed.js
const { pool } = require('./config/db');

async function seedDatabase() {
  await pool.query(`
    INSERT INTO books (title, author, user_id, status)
    VALUES 
      ('Dune', 'Frank Herbert', 1, 'available'),
      ('Fondation', 'Isaac Asimov', 1, 'available')
  `);
  console.log("Données de test insérées !");
}

seedDatabase();