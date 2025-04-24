import React, { useEffect, useState } from 'react';
import { Plus } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';  // Assurez-vous que ce chemin est correct
import './Home.css';

const HomePage = ({ isAuthenticated, onOpenLogin }) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);  // Pour gérer l'état de chargement
  const [error, setError] = useState(null); // Pour gérer les erreurs

  // Fonction pour récupérer les livres depuis l'API
  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/books');  // Assurez-vous que l'URL est correcte
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des livres');
      }
      const data = await response.json();
      setBooks(data.books);  // Supposons que les livres arrivent sous la forme { books: [...] }
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
      setError('Erreur lors du chargement des livres');
    } finally {
      setLoading(false);  // Lorsque la récupération des livres est terminée (qu’elle réussisse ou non)
    }
  };

  useEffect(() => {
    fetchBooks(); // Récupère les livres lors du chargement de la page
  }, []);

  const handleAddBookClick = () => {
    if (isAuthenticated) {
      navigate('/add-book');
    } else {
      onOpenLogin(); // Ouvre la modale de connexion
    }
  };

  return (
    <>
      {/* Partie centrée */}
      <div className="home-container">
        <div className="cta-box">
          <div className="cta-text">
            <span className="cta-main">C'est le moment de se cultiver !</span>
            <span className="cta-sub">Ajoutez un livre et partagez le savoir.</span>
          </div>
          <button 
            className="add-book-button" 
            onClick={handleAddBookClick}
          >
            <Plus size={20} />
            <span>Ajouter un livre</span>
          </button>
        </div>
      </div>

      {/* Partie alignée à gauche, hors du conteneur centré */}
      <main className="home-content-standalone">
        <h1>Bienvenue sur BookSwap</h1>
        <p>Page d'accueil</p>

        {/* Affichage des livres en cartes */}
        <div className="book-list">
          {loading ? (
            <p>Chargement des livres...</p>
          ) : error ? (
            <p>{error}</p>
          ) : books.length > 0 ? (
            books.map((book) => (
              <BookCard key={book.id} book={book} />
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
