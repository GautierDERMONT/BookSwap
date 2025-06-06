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
      <h2 className="sr-title">
        <svg className="search-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
        </svg>
        Résultats de recherche
      </h2>

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