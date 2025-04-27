import React, { useState, useEffect } from 'react';
import './BookCard.css';

export default function BookCard({ book, isAuthenticated, currentUser, onRequireLogin }) {
  const userId = currentUser?.userId || currentUser?.id; // compatibilité selon structure
  const storageKey = userId ? `favorite-${userId}-${book.id}` : null;
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      setIsFavorite(saved === 'true');
    }
  }, [storageKey]);

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);
    localStorage.setItem(storageKey, newFavorite.toString());
  };

  const imageUrl = book.image_url
    ? `http://localhost:5001${book.image_url}`
    : `http://localhost:5001/uploads/${book.image_url}`;

  return (
    <div className="book-card">
      <div className="book-image-container">
        <img src={imageUrl} alt={book.title} className="book-image" />
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
