import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';
import BookCard from '../components/BookCard';

const Profile = ({ currentUser, isPublicProfile = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    location: '',
    bio: '',
    avatar: null,
    deleteAvatar: false
  });
  const [tempAvatar, setTempAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userBooks, setUserBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const navigate = useNavigate();
  const { userId } = useParams();

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
            location: response.data.location || '',
            bio: response.data.bio || '',
            avatar: null,
            deleteAvatar: false
          });
          setTempAvatar(response.data.avatar ? `http://localhost:5001${response.data.avatar}` : '');
        } else {
          const response = await axios.get('http://localhost:5001/api/auth/profile', {
            withCredentials: true
          });
          setFormData({
            username: response.data.username,
            location: response.data.location || '',
            bio: response.data.bio || '',
            avatar: null,
            deleteAvatar: false
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
        const targetUserId = isPublicProfile ? userId : currentUser.id;
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
  }, [currentUser, userId, isPublicProfile]);

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempAvatar(event.target.result);
      setFormData(prev => ({
        ...prev,
        avatar: file,
        deleteAvatar: false
      }));
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
  };

  const handleCancelDelete = () => {
    setFormData(prev => ({
      ...prev,
      deleteAvatar: false
    }));
    setTempAvatar(`http://localhost:5001${currentUser.avatar}`);
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage({ text: '', type: '' });

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
          bio: formData.bio
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
        text: error.response?.data?.error || 'Erreur lors de la mise à jour du profil', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
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
          </div>

          <div className="profile-form-bio">
            <div className="profile-form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
              />
            </div>

            {message.text && (
              <div className={`profile-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="profile-submit-button">
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
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
              <h2>{formData.username}</h2>
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

      <div className="user-books-section">
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
                  onRequireLogin={() => {}} 
                  hideOwnerBadge={true}  
                />
                {!isPublicProfile && (
                  <div className="book-hover-actions">
                    <button 
                      className="edit-book-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/books/${book.id}/edit`);
                      }}
                    >
                      ✏️ Modifier
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