import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart } from 'react-feather'; // Import de l'icône Heart
import BookCard from '../components/BookCard';
import './Favorites.css';

export default function FavoritesPage({ currentUser }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/favorites/${currentUser.id}`);
      setFavorites(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des favoris:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  if (loading) return <div className="loading-screen">Chargement des favoris...</div>;

  return (
    <div className="favorites-page">
      <h2>
        Mes livres favoris
        <Heart size={45} fill="#e74c3c" color="#e74c3c" className="heart-icon" />

      </h2>
      <div className="favorites-list">
        {favorites.length === 0 ? (
          <p>Vous n'avez encore aucun livre en favori.</p>
        ) : (
          favorites.map(book => (
            <BookCard
              key={book.id}
              book={book}
              isAuthenticated={true}
              currentUser={currentUser}
              onRequireLogin={() => {}}
              hideOwnerBadge={false}
            />
          ))
        )}
      </div>
    </div>
  );
}