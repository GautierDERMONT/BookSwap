// frontend/src/pages/Books.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import BookCard from '../components/BookCard';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        setBooks(res.data.books);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des livres');
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="book-list">
      {books.length > 0 ? (
        books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))
      ) : (
        <p>Aucun livre disponible</p>
      )}
    </div>
  );
}