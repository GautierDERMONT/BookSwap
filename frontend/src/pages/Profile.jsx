import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Profile.css';
import BookCard from '../components/BookCard';

const Profile = ({ currentUser, isPublicProfile = false, executeAfterAuth }) => {
  const [formData, setFormData] = useState({
    username: '',
    location: '',
    bio: '',
    avatar: null,
    deleteAvatar: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [tempAvatar, setTempAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userBooks, setUserBooks] = useState([]);
  const [bioWordCount, setBioWordCount] = useState(0);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToBooks) {
      setTimeout(() => {
        const booksSection = document.getElementById('user-books-section');
        if (booksSection) {
          booksSection.scrollIntoView({ behavior: 'smooth' });
        }
        navigate(location.pathname, { replace: true, state: {} });
      }, 100);
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isPublicProfile && userId) {
          const response = await axios.get(`http://localhost:5001/api/auth/profile/${userId}`, {
            withCredentials: true
          });
          setProfileUser(response.data);
          setFormData({
            username: response.data.username,
            email: response.data.email,
            location: response.data.location || '',
            bio: response.data.bio || '',
            avatar: null,
            deleteAvatar: false,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setTempAvatar(response.data.avatar ? `http://localhost:5001${response.data.avatar}` : '');
        } else {
          const response = await axios.get('http://localhost:5001/api/auth/profile', {
            withCredentials: true
          });
          setFormData({
            username: response.data.username,
            email: response.data.email,
            location: response.data.location || '',
            bio: response.data.bio || '',
            avatar: null,
            deleteAvatar: false,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setTempAvatar(response.data.avatar ? `http://localhost:5001${response.data.avatar}` : '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage({ text: 'Erreur lors du chargement du profil', type: 'error' });
      }
    };

    const fetchUserBooks = async () => {
      try {
        const targetUserId = isPublicProfile ? userId : currentUser?.id;
        const response = await axios.get(`http://localhost:5001/api/books/user/${targetUserId}`, {
            withCredentials: true
          });
        setUserBooks(response.data.books);
      } catch (error) {
        console.error('Error fetching user books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchProfile();
    if (currentUser?.id || userId) {
      fetchUserBooks();
    }

    if (currentUser && isPublicProfile && userId && currentUser.id === parseInt(userId)) {
      navigate('/profile');
    }
  }, [currentUser, isPublicProfile, userId, navigate]);

  const getDefaultAvatar = (username) => {
    if (!username) return '';
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3'];
    const color = colors[firstLetter.charCodeAt(0) % colors.length];
    
    return (
      <div 
        className="default-avatar" 
        style={{ 
          backgroundColor: color,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '3rem',
          fontWeight: 'bold'
        }}
      >
        {firstLetter}
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'bio') {
      const wordArray = value.trim().split(/\s+/).filter(Boolean);
      const wordCount = wordArray.length;

      if (wordCount > 50) {
        setMessage({ text: 'La bio ne peut pas dépasser 50 mots.', type: 'error' });
        return;
      } else {
        setMessage({ text: '', type: '' });
      }

      setBioWordCount(wordCount);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérification de la taille du fichier (5Mo max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
      setMessage({ text: 'La taille de l\'avatar ne doit pas dépasser 5Mo', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempAvatar(event.target.result);
      setFormData(prev => ({
        ...prev,
        avatar: file,
        deleteAvatar: false
      }));
      setMessage({ text: '', type: '' }); // Clear any previous error messages
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setFormData(prev => ({
      ...prev,
      deleteAvatar: true,
      avatar: null
    }));
    setTempAvatar('');
    setMessage({ text: '', type: '' }); // Clear any previous error messages
  };

  const handleCancelDelete = () => {
    setFormData(prev => ({
      ...prev,
      deleteAvatar: false
    }));
    setTempAvatar(`http://localhost:5001${currentUser.avatar}`);
    setMessage({ text: '', type: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage({ text: '', type: '' });

      // Vérification supplémentaire de la taille de l'avatar au cas où
      if (formData.avatar && formData.avatar.size > 5 * 1024 * 1024) {
        throw new Error('La taille de l\'avatar ne doit pas dépasser 5Mo');
      }

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Les nouveaux mots de passe ne correspondent pas');
        }

        if (!formData.currentPassword) {
          throw new Error('Le mot de passe actuel est requis pour changer le mot de passe');
        }
      }

      if (formData.deleteAvatar) {
        await axios.delete('http://localhost:5001/api/auth/avatar', {
          withCredentials: true
        });
      } else if (formData.avatar) {
        const avatarForm = new FormData();
        avatarForm.append('avatar', formData.avatar);
        
        await axios.put(
          'http://localhost:5001/api/auth/avatar',
          avatarForm,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      await axios.put(
        'http://localhost:5001/api/auth/profile',
        {
          username: formData.username,
          location: formData.location,
          bio: formData.bio,
          currentPassword: formData.newPassword ? formData.currentPassword : '',
          newPassword: formData.newPassword || undefined
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage({ text: 'Profil mis à jour avec succès', type: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: error.response?.data?.error || error.message || 'Erreur lors de la mise à jour du profil', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera tous vos livres, messages et données.')) {
      try {
        setIsLoading(true);
        await axios.delete('http://localhost:5001/api/auth/account', {
          withCredentials: true
        });
        setMessage({ text: 'Compte supprimé avec succès', type: 'success' });
        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('Error deleting account:', error);
        setMessage({ 
          text: error.response?.data?.error || 'Erreur lors de la suppression du compte', 
          type: 'error' 
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="profile-page">
      <h1>{isPublicProfile ? `Profil de ${formData.username}` : 'Mon Profil'}</h1>

      {!isPublicProfile ? (
        <form onSubmit={handleSubmit} className="profile-form-horizontal">
          <div className="profile-left">
            <div className="profile-avatar-container">
              {!formData.deleteAvatar && tempAvatar ? (
                <img 
                  src={tempAvatar} 
                  alt="Avatar" 
                  className="profile-avatar-image"
                />
              ) : (
                getDefaultAvatar(formData.username)
              )}
            </div>
            <div className="avatar-actions">
              <input
                type="file"
                id="profile-avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isLoading}
              />
              <label htmlFor="profile-avatar-upload" className="profile-upload-button">
                {isLoading ? 'Chargement...' : 'Changer d\'avatar'}
              </label>
              {!formData.deleteAvatar && tempAvatar && (
                <button 
                  type="button"
                  onClick={handleDeleteAvatar}
                  className="profile-delete-button"
                  disabled={isLoading}
                >
                  Supprimer l'avatar
                </button>
              )}
              {formData.deleteAvatar && (
                <button 
                  type="button"
                  onClick={handleCancelDelete}
                  className="profile-cancel-button"
                  disabled={isLoading}
                >
                  Annuler suppression
                </button>
              )}
            </div>
          </div>

          <div className="profile-right">
            <div className="profile-form-group">
              <label>Nom d'utilisateur</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="profile-form-group">
              <label>Localisation</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="profile-form-group profile-password-container1">
              <label>Mot de passe actuel</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Entrez votre mot de passe actuel"
                />
                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="profile-form-group profile-password-container2">
              <label>Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Entrez un nouveau mot de passe"
                />
                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="profile-form-group profile-password-container">
              <label>Confirmer le nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmez le nouveau mot de passe"
                />
                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <div className="profile-form-bio">
            <div className="profile-form-group">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Parlez un peu de vous (50 mots max)"
              />
              <div className="bio-word-count">
                {bioWordCount} / 50 mots
              </div>
            </div>

            {message.text && (
              <div className={`profile-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="profile-buttons-container">
              <button type="submit" disabled={isLoading} className="profile-submit-button">
                {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>

              <button 
                type="button" 
                onClick={handleDeleteAccount} 
                disabled={isLoading} 
                className="profile-delete-account-button"
              >
                {isLoading ? 'Suppression en cours...' : 'Supprimer mon compte'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="profile-public-info">
          <div className="profile-left">
            <div className="profile-avatar-container">
              {tempAvatar ? (
                <img 
                  src={tempAvatar} 
                  alt="Avatar" 
                  className="profile-avatar-image"
                />
              ) : (
                getDefaultAvatar(formData.username)
              )}
            </div>
          </div>
          <div className="profile-right">
            <div className="profile-public-details">
              {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
              {formData.location && <p><strong>Localisation:</strong> {formData.location}</p>}
              {formData.bio && (
                <div className="profile-bio">
                  <h3>Bio</h3>
                  <p>{formData.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="user-books-section" id="user-books-section">
        <h2>Livres {isPublicProfile ? 'de cet utilisateur' : 'postés'} ({userBooks.length})</h2>
        
        {loadingBooks ? (
          <p>Chargement des livres...</p>
        ) : userBooks.length > 0 ? (
          <div className="user-books-grid">
            {userBooks.map(book => (
              <div key={book.id} className="user-book-card-wrapper">
                <BookCard 
                  book={book} 
                  isAuthenticated={!!currentUser} 
                  currentUser={currentUser} 
                  executeAfterAuth={executeAfterAuth}
                  onRequireLogin={executeAfterAuth}
                  hideOwnerBadge={true}  
                />
                {!isPublicProfile && (
                  <div className="book-hover-actions">
                    <br />
                    <button 
                      className="edit-book-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/books/${book.id}/edit`);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                        <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="white"/>
                      </svg>
                      Modifier
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-books-message">
            <p>{isPublicProfile ? 'Cet utilisateur n\'a pas encore ajouté de livres.' : 'Vous n\'avez pas encore ajouté de livres.'}</p>
            {!isPublicProfile && (
              <button 
                className="add-book-button"
                onClick={() => navigate('/add-book')}
              >
                Ajouter un livre
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;