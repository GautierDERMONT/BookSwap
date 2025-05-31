import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookCard.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const UserAvatar = ({ avatar, username, size = 20 }) => {
  if (!avatar && !username) return null;
  
  if (!avatar) {
    const firstLetter = username?.charAt(0).toUpperCase() || '?';
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3'];
    const color = colors[firstLetter.charCodeAt(0) % colors.length];
    
    return (
      <div 
        style={{ 
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}
      >
        {firstLetter}
      </div>
    );
  }
  
  return (
    <img 
      src={avatar.startsWith('/uploads') 
        ? `http://localhost:5001${avatar}`
        : `http://localhost:5001/uploads/${avatar}`}
      alt={username}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover'
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
};

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

  const ownerInfo = {
    id: book.user_id || book.user?.id,
    username: book.username || book.user?.username,
    avatar: book.avatar || book.user?.avatar,
    email: book.email || book.user?.email
  };

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

  const handleOwnerClick = (e) => {
    e.stopPropagation();
    if (ownerInfo.id) {
      navigate(`/user/${ownerInfo.id}`);
    }
  };

  return (
    <div className="book-card" onClick={() => navigate(`/books/${book.id}`)} data-id={book.id}>
      {!hideOwnerBadge && (isOwner || ownerInfo.username) && (
        <div 
          className={`owner-badge ${isOwner ? 'my-book-badge' : ''}`}
          onClick={handleOwnerClick}
        >
          <UserAvatar 
            avatar={ownerInfo.avatar} 
            username={ownerInfo.username}
            size={20}
          />
          <span className="owner-name">
            {isOwner ? 'Mon livre' : ownerInfo.username}
          </span>
        </div>
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