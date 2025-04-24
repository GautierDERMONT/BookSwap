import React from 'react';
import { Plus } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const HomePage = ({ isAuthenticated, onOpenLogin }) => {
  const navigate = useNavigate();

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
      </main>
    </>
  );
};

export default HomePage;
