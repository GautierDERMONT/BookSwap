import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import BookCard from '../components/BookCard';
import './SearchResults.css';

export default function SearchResults({ isAuthenticated, currentUser, onOpenLogin }) {
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q') || '';
    const locationFilter = searchParams.get('location') || '';
    const conditionFilter = searchParams.get('condition') || '';
    const genreFilter = searchParams.get('genre') || '';

    const fetchSearchResults = async () => {
      try {
        let url = '/books/search?';
        if (query) url += `q=${encodeURIComponent(query)}&`;
        if (locationFilter) url += `location=${encodeURIComponent(locationFilter)}&`;
        if (conditionFilter) url += `condition=${encodeURIComponent(conditionFilter)}&`;
        if (genreFilter) url += `genre=${encodeURIComponent(genreFilter)}`;

        url = url.endsWith('&') ? url.slice(0, -1) : url;

        const res = await api.get(url);
        const books = res.data.books.map(book => ({
          ...book,
          user: {
            id: book.user_id,
            username: book.username,
            avatar: book.avatar,
            email: book.email
          }
        }));
        setBooks(books);
        setLoading(false);
      } catch (err) {
        console.error('Search error:', err);
        setError('Erreur lors de la recherche');
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [location.search]);

  if (loading) return <div className="sr-loading">Recherche en cours...</div>;
  if (error) return <div className="sr-error">{error}</div>;

  return (
    <div className="sr-container">
      <h2 className="sr-title">🔎 Résultats de recherche</h2>

      {books.length > 0 ? (
        <div className="sr-book-list">
          {books.map((book) => (
            <BookCard 
              key={book.id} 
              book={book} 
              isAuthenticated={isAuthenticated} 
              currentUser={currentUser} 
              onRequireLogin={onOpenLogin} 
            />
          ))}
        </div>
      ) : (
        <p className="sr-no-results">
          Aucun résultat trouvé pour vos critères de recherche
        </p>
      )}
    </div>
  );
}