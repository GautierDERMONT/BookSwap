import React, { useEffect, useState } from 'react';
import { Plus, BookOpen } from 'react-feather';
import { useNavigate, useLocation } from 'react-router-dom';
import BookCard from '../components/BookCard';
import './Home.css';

const HomePage = ({ isAuthenticated, currentUser, onOpenLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.showLogin) {
      onOpenLogin();
      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          showLogin: false,
        },
      });
    }

    if (isAuthenticated && location.state?.redirectAfterLogin === '/add-book') {
      navigate('/add-book');
    }
  }, [location.state, isAuthenticated, onOpenLogin, navigate, location.pathname]);

  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/books');
      if (!response.ok) throw new Error('Erreur lors de la récupération des livres');
      const data = await response.json();
      setBooks(data.books);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des livres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAddBookClick = () => {
    if (isAuthenticated) {
      navigate('/add-book');
    } else {
      navigate('/', {
        state: {
          showLogin: true,
          redirectAfterLogin: '/add-book',
        },
        replace: true
      });
      onOpenLogin();
    }
  };
  
  return (
    <>
      <div className="home-container">
        <div className="home-cta-box">
          <div className="home-cta-text">
            <span className="home-cta-main">Bienvenue sur ZGM Book, c'est le moment de se cultiver !</span>
            <span className="home-cta-sub">Ajoutez un livre et partagez le savoir.</span>
          </div>
          <button className="home-add-book-button" onClick={handleAddBookClick}>
            <Plus size={20} />
            <span>Ajouter un livre</span>
          </button>
        </div>
      </div>

      <main className="home-content">
        <h1>
          <BookOpen size={50} className="book-icon" />
          Parcourir la liste des livres
        </h1>
        <br />
        <div className="home-book-list">
          {loading ? (
            <p>Chargement des livres...</p>
          ) : error ? (
            <p>{error}</p>
          ) : books.length > 0 ? (
            books.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                isAuthenticated={isAuthenticated} 
                currentUser={currentUser} 
                onRequireLogin={onOpenLogin} 
                hideOwnerBadge={false}
              />
            ))
          ) : (
            <p>Aucun livre disponible pour l'instant.</p>
          )}
        </div>
      </main>
    </>
  );
};

export default HomePage;