import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookCard.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export default function BookCard({ book, isAuthenticated, currentUser, onRequireLogin, hideOwnerBadge }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
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

  const imageUrl = useMemo(() => {
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
    return null;
  }, [book.images, book.image_url]);

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

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="book-card" onClick={() => navigate(`/books/${book.id}`)} data-id={book.id}>
      {!hideOwnerBadge && isOwner && (
        <div className="owner-badge">Mon livre</div>
      )}
      <div className="book-image-container">
        {imageUrl ? (
          <>
            <img 
              src={imageUrl}
              alt={book.title}
              className={`book-image ${imageLoaded ? 'loaded' : 'loading'}`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!imageLoaded && !imageError && (
              <div className="image-placeholder">
                <span>Chargement...</span>
              </div>
            )}
          </>
        ) : (
          <div className="image-placeholder">
            <span>Aucune image</span>
          </div>
        )}
        {imageError && (
          <div className="image-placeholder">
            <span>Erreur de chargement</span>
          </div>
        )}
        <button 
          className="favorite-button" 
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          {isFavorite ? <FaHeart color="#f44336" /> : <FaRegHeart />}
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
  );
}