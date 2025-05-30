// Importation des hooks React et des outils de navigation de React Router
import React, { useEffect, useState } from 'react';
import { Plus } from 'react-feather'; // Icône "Plus" pour le bouton
import { useNavigate, useLocation } from 'react-router-dom';
import BookCard from '../components/BookCard'; // Composant pour afficher chaque livre
import './Home.css'; // Fichier de styles CSS

// Définition du composant principal de la page d'accueil
const HomePage = ({ isAuthenticated, currentUser, onOpenLogin }) => {
  const navigate = useNavigate(); // Hook pour la navigation
  const location = useLocation(); // Hook pour accéder à la localisation actuelle (URL + état)
  
  // État local pour stocker les livres, l'état de chargement, et les erreurs
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect déclenché au montage et lorsqu'une redirection ou connexion est attendue
  useEffect(() => {
    // Si le state de l'URL demande d'afficher le login, on ouvre la modal de login
    if (location.state?.showLogin) {
      onOpenLogin(); // Affiche la modal de connexion

      // Nettoie l'état pour éviter de relancer la modale en cas de rechargement
      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          showLogin: false,
        },
      });
    }

    // Redirige automatiquement vers /add-book après connexion si demandé
    if (isAuthenticated && location.state?.redirectAfterLogin === '/add-book') {
      navigate('/add-book');
    }
  }, [location.state, isAuthenticated, onOpenLogin, navigate, location.pathname]);

  // Fonction pour récupérer les livres depuis l'API
  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/books');
      if (!response.ok) throw new Error('Erreur lors de la récupération des livres');
      const data = await response.json(); // Parse la réponse JSON
      setBooks(data.books); // Stocke les livres dans l'état local
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des livres'); // Affiche une erreur à l'utilisateur
    } finally {
      setLoading(false); // Désactive le chargement dans tous les cas
    }
  };

  // Appel initial à la récupération des livres lors du montage du composant
  useEffect(() => {
    fetchBooks();
  }, []);

  // Gère le clic sur "Ajouter un livre"
  const handleAddBookClick = () => {
    if (isAuthenticated) {
      navigate('/add-book'); // Si connecté, redirige vers l’ajout
    } else {
      // Sinon, affiche la modal de login et prépare la redirection après login
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
      {/* Zone d’introduction avec un appel à l'action pour ajouter un livre */}
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

      {/* Liste des livres disponibles */}
      <main className="home-content">
        <h1>📚 Parcourir la liste des livres</h1>
        <br />
        <div className="home-book-list">
          {/* Affichage conditionnel selon l’état du chargement ou erreurs */}
          {loading ? (
            <p>Chargement des livres...</p>
          ) : error ? (
            <p>{error}</p>
          ) : books.length > 0 ? (
            // Affiche chaque livre dans une carte
            books.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                isAuthenticated={isAuthenticated} 
                currentUser={currentUser} 
                onRequireLogin={onOpenLogin} 
                hideOwnerBadge={false} // ou une prop calculée

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
