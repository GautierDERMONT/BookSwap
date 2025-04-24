import React, { useState, useEffect } from 'react';
import './BookCard.css'; // Fichier CSS dédié

export default function BookCard({ book }) {
  const [isFavorite, setIsFavorite] = useState(false);  // Pour gérer l'état du favori

  // 🧠 Check localStorage à l'ouverture
  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
    setIsFavorite(storedFavorites.includes(book.id));
  }, [book.id]);

  const handleFavoriteClick = () => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let updatedFavorites;

    if (storedFavorites.includes(book.id)) {
      updatedFavorites = storedFavorites.filter(id => id !== book.id);
    } else {
      updatedFavorites = [...storedFavorites, book.id];
    }

    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setIsFavorite(!isFavorite);
    console.log(`${book.title} ${!isFavorite ? 'ajouté à' : 'retiré des'} favoris`);
  };

  // ✅ Construction propre de l'image
  const imageUrl = book.image_url?.startsWith('/uploads')
    ? `http://localhost:5001${book.image_url}`
    : `http://localhost:5001/uploads/${book.image_url}`;

  return (
    <div className="book-card">
      <div className="book-image-container">
        <img 
          src={imageUrl}
          alt={book.title}
          className="book-image"
        />
        <button className="favorite-button" onClick={handleFavoriteClick}>
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <div className="book-meta">
          <span className="book-location">{book.location}</span>
          <span className="book-condition">{book.condition}</span>
        </div>
      </div>
    </div>
  );
}
