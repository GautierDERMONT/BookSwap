import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ book, isAuthenticated, currentUser, onRequireLogin, hideOwnerBadge }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const userId = currentUser?.userId || currentUser?.id;
  const storageKey = userId ? `favorite-${userId}-${book.id}` : null;
  const navigate = useNavigate();
  const isOwner = currentUser && book.users_id === currentUser.id;

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      setIsFavorite(saved === 'true');
    }
  }, [storageKey]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);

    if (storageKey) {
      localStorage.setItem(storageKey, newFavorite.toString());
    }

    setModalMessage(newFavorite ? "Ajouté aux favoris !" : "Supprimé des favoris !");
    setShowFavoriteModal(true);
    setTimeout(() => setShowFavoriteModal(false), 1500);

    try {
      const response = await fetch(`http://localhost:5001/api/favorites`, {
        method: newFavorite ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, bookId: book.id }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des favoris');
      }
    } catch (error) {
      console.error(error);
      setIsFavorite(!newFavorite);
      setShowFavoriteModal(false);
    }
  };

  const getImageUrl = () => {
    if (book.images && book.images.length > 0) {
      const firstImage = book.images[0];
      return firstImage.startsWith('/uploads')
        ? `http://localhost:5001${firstImage}`
        : `http://localhost:5001/uploads/${firstImage}`;
    }
    
    if (book.image_url) {
      if (book.image_url.startsWith('http')) return book.image_url;
      return `http://localhost:5001${book.image_url.startsWith('/') ? '' : '/'}${book.image_url}`;
    }

    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  };

  return (
    <>
      <div className="book-card" onClick={() => navigate(`/books/${book.id}`)}>
        {!hideOwnerBadge && isOwner && (
          <div className="owner-badge">Mon livre</div>
        )}
        <div className="book-image-container">
          <img 
            src={getImageUrl()} 
            alt={book.title}
            className="book-image"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5FcnJldXI8L3RleHQ+PC9zdmc+';
            }}
          />
          <button className="favorite-button" onClick={handleFavoriteClick}>
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
        <div className="book-info">
          <h3 className="book-title">
            {book.title}
            {book.author && <span className="book-author-small">{book.author}</span>}
          </h3>
          <div className="book-meta">
            <span className="book-location">{book.location}</span>
            <span className="book-condition">{book.condition}</span>
          </div>
        </div>
      </div>

  
    </>
  );
}