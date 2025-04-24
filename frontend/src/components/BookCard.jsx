import React, { useState } from 'react';
import './BookCard.css'; // Fichier CSS dédié

export default function BookCard({ book }) {
  const [isFavorite, setIsFavorite] = useState(false);  // Pour gérer l'état du favori

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
    console.log(`${book.title} ajouté aux favoris: ${!isFavorite}`);
  };

  // Si l'URL de l'image n'est pas complète, on va compléter avec le chemin de base
  const imageUrl = book.image_url
  ? `http://localhost:5001${book.image_url}`
  : `http://localhost:5001/uploads/${book.image_url}`;


  return (
    <div className="book-card">
      <div className="book-image-container">
        <img 
          src={imageUrl} // On utilise ici l'URL modifiée
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
