// frontend/src/pages/Books.jsx
import { useEffect, useState } from 'react';
import api from '../api';
import BookCard from '../components/BookCard';
import './Books.css'; 


export default function Books() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        setBooks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBooks();
  }, []);

  return (
    <div className="books-container">
      <h1>Catalogue de Livres</h1>
      <div className="books-grid">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}