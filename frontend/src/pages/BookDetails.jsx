import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import './BookDetails.css';

const API_URL = 'http://localhost:5001';

const getImageUrl = (img) =>
  img?.startsWith('/uploads') ? `${API_URL}${img}` : `${API_URL}/uploads/${img || 'placeholder.jpg'}`;

const BookDetails = ({ currentUser, executeAfterAuth }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const gridRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(null);
  
  const userId = currentUser?.userId || currentUser?.id;
  const storageKey = userId && book?.id ? `favorite-${userId}-${book.id}` : null;
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      setIsFavorite(saved === 'true');
    }
  }, [storageKey]);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/books/${id}`);
        const images = data.book.images?.length
          ? data.book.images.map(getImageUrl)
          : [`${API_URL}/placeholder.jpg`];
        setBook({ ...data.book, images });
      } catch (error) {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (gridRef.current) {
      setGridHeight(gridRef.current.offsetHeight);
    }
  }, [book, loading]);

  const openZoom = (idx) => setZoomedImageIndex(idx);
  const closeZoom = () => setZoomedImageIndex(null);

  const navigateZoom = (dir) => {
    if (!book?.images) return;
    setZoomedImageIndex((prev) =>
      dir === 'next'
        ? (prev + 1) % book.images.length
        : (prev - 1 + book.images.length) % book.images.length
    );
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    
    executeAfterAuth(async () => {
      const newFavorite = !isFavorite;
      setIsFavorite(newFavorite);

      if (storageKey) {
        localStorage.setItem(storageKey, newFavorite.toString());
      }

      setModalMessage(newFavorite ? "Ajouté aux favoris !" : "Supprimé des favoris !");
      setShowFavoriteModal(true);
      setTimeout(() => setShowFavoriteModal(false), 1500);

      try {
        const response = await fetch(`${API_URL}/api/favorites`, {
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
    });
  };

  const handleModalClick = (e) => {
    if (
      e.target.classList.contains('nav-arrow') ||
      e.target.closest('.nav-arrow') ||
      e.target.classList.contains('zoomed-image')
    )
      return;
    closeZoom();
  };

  const handleEditClick = () => {
    navigate(`/books/${id}/edit`);
  };

  const handleDeleteClick = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce livre ?")) {
      try {
        await api.delete(`/books/${id}`, { 
          withCredentials: true 
        });
        navigate('/', { state: { bookDeleted: true } });
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert(error.response?.data?.error || "Échec de la suppression");
      }
    }
  };

  const handleMessageClick = () => {
    executeAfterAuth(async () => {
      try {
        const response = await api.post('/conversations', {
          bookId: book.id,
          recipientId: book.user.id
        }, { withCredentials: true });

        navigate(`/messages/${response.data.conversationId}`, {
          state: {
            bookId: book.id,
            recipientId: book.user.id,
            bookInfo: {
              id: book.id,
              title: book.title,
              bookLocation: book.location,
              image: book.images?.[0]
            },
            interlocutor: {
              id: book.user.id,
              username: book.user.username,
              avatar: book.user.avatar
            }
          },
          replace: true // Ajoutez ceci pour éviter la duplication dans l'historique
        });
      } catch (error) {
        console.error("Erreur lors de la création de la conversation:", error);
        alert(error.response?.data?.error || "Impossible de démarrer la conversation");
      }
    });
  };


  if (loading) return <div className="book-details-loading">Chargement...</div>;
  if (!book) return <div className="book-details-error">Livre non trouvé</div>;

  const images = book.images;
  const isOwner = currentUser && book && (currentUser.userId === book.users_id || currentUser.id === book.users_id);
  
  return (
    <div className="book-details-wrapper">
      <div className="book-details-page">
        <div className="book-details-images">
          <div className="book-details-image-grid" ref={gridRef}>
            <div className="book-details-main-image">
              {images[0] ? (
                <img
                  src={images[0]}
                  alt={book.title}
                  onClick={() => openZoom(0)}
                  onError={(e) => (e.target.src = `${API_URL}/placeholder.jpg`)}
                />
              ) : (
                <div className="empty-image">Pas d'image disponible</div>
              )}
            </div>
            {[1, 2].map((index) => (
              <div className="book-details-thumbnail-frame" key={index}>
                {images[index] ? (
                  <img
                    src={images[index]}
                    alt={`${book.title} miniature ${index}`}
                    className="book-details-thumbnail"
                    onClick={() => openZoom(index)}
                    onError={(e) => (e.target.src = `${API_URL}/placeholder-thumbnail.jpg`)}
                  />
                ) : (
                  <div className="empty-image">pas d'autre image</div>
                )}
              </div>
            ))}
          </div>
          <button
            className="favorite-button"
            onClick={handleFavoriteClick}
            aria-label="Ajouter aux favoris"
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        <div
          className="book-details-info"
          style={gridHeight ? { height: gridHeight } : undefined}
        >
          <h1>{book.title}</h1>
          <h2>{book.author || 'Auteur inconnu'}</h2>
            <div className="book-details-meta">
              <p className="publisher-info">
                <strong>Proposé par :</strong>
                  <Link 
                      to={`/user/${book.user.id}`} 
                      className="publisher-link"
                      onClick={(e) => {
                        if (currentUser && (currentUser.id === book.user.id || currentUser.userId === book.user.id)) {
                          e.preventDefault();
                          navigate('/profile');
                        }
                      }}
                    >
                      {book.avatar ? (
                        <img 
                          src={`${API_URL}${book.avatar}`}
                          alt={`Avatar de ${book.username}`}
                          className="header-default-avatar"
                          onError={(e) => {
                            e.target.src = `${API_URL}/default-avatar.png`;
                            console.error("Erreur de chargement de l'avatar:", book.avatar);
                          }}
                        />
                      ) : (
                        <div className="default-avatar">
                          {book.username?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      )}
                      <span>{book.username || 'Anonyme'}</span>
                    </Link>
              </p>
              <p><strong>Catégorie :</strong> {book.category || 'Non spécifié'}</p>
              <p><strong>État :</strong> {book.condition || 'Non spécifié'}</p>
              <p><strong>Localisation :</strong> {book.location || 'Non spécifié'}</p>
              <p><strong>Disponibilité :</strong> 
                <span className={`availability-${book.availability?.toLowerCase()}`}>
                    {book.availability || 'Non spécifié'}
                </span>
              </p>
            </div>
          <div className="book-details-description">
            <h3>Description</h3>
            <p>{book.description || 'Aucune description disponible.'}</p>
          </div>
          
          <div className="book-actions">
            {isOwner ? (
              <>
                <button className="edit-button" onClick={handleEditClick}>
                  Modifier le livre
                </button>
                <button className="delete-button" onClick={handleDeleteClick}>
                  Supprimer
                </button>
              </>
            ) : (
              <button className="message-button" onClick={handleMessageClick}>
                Envoyer un message
              </button>
            )}
          </div>
        </div>

        {zoomedImageIndex !== null && (
          <div className="zoomed-image-modal" onClick={handleModalClick}>
            <div className="zoomed-image-container">
              <div className="image-navigation">
                <button
                  className="nav-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateZoom('prev');
                  }}
                >
                  &#10094;
                </button>
                <button
                  className="nav-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateZoom('next');
                  }}
                >
                  &#10095;
                </button>
              </div>
              <img
                src={images[zoomedImageIndex]}
                alt="Agrandissement"
                className="zoomed-image"
              />
              <button className="close-button" onClick={closeZoom}>
                &#10005;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetails;