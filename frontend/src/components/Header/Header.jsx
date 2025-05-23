import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, MessageCircle, User, Plus, LogOut, ChevronDown } from 'react-feather';
import api from '../../services/api';
import './Header.css';
import logo from '../../assets/logo.png';

const Header = ({ isAuthenticated, currentUser, onOpenLogin, onOpenSignup, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getDefaultAvatar = (username) => {
    if (!username) return <User size={20} className="header-profile-icon" />;
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3'];
    const color = colors[firstLetter.charCodeAt(0) % colors.length];
    return (
      <div 
        className="header-default-avatar-icon"
        style={{
          backgroundColor: color,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1rem',
          fontWeight: 'bold'
        }}
      >
        {firstLetter}
      </div>
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/books');
    }
    setShowSuggestions(false);
  };

  const handleAddBookClick = () => {
    isAuthenticated ? navigate('/add-book') : onOpenLogin();
  };

  const handleFavoritesClick = () => {
    if (isAuthenticated) {
      navigate('/favorites');
    } else {
      onOpenLogin();
      navigate('/', { state: { showLogin: true, redirectAfterLogin: '/favorites' } });
    }
  };

  const handleMessageClick = () => {
    if (isAuthenticated) {
      navigate('/messages');
    } else {
      onOpenLogin();
      navigate('/', { state: { showLogin: true, redirectAfterLogin: '/messages' } });
    }
  };

  const handleProfileClick = () => {
    isAuthenticated ? navigate('/profile') : onOpenLogin();
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/unread-count');
      setUnreadMessages(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus', error);
    }
  };

  const fetchSearchSuggestions = async (query) => {
    try {
      const response = await api.get(`/books/suggestions?q=${encodeURIComponent(query)}`);
      setSearchSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  useEffect(() => {
    isAuthenticated ? fetchUnreadMessages() : setUnreadMessages(0);
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchSearchSuggestions(searchQuery);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  return (
    <header className="header-app">
      <div className="header-top">
        <Link to="/" className="header-logo-link">
          <img src={logo} alt="BookSwap" className="header-logo" />
        </Link>

        <form className="header-search-container" onSubmit={handleSearch}>
          <div className="header-search-bar">
            <input
              type="text"
              placeholder="Recherche rapide par titre ou auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <button type="submit" className="header-search-button">
              <Search size={18} />
            </button>
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="search-suggestions">
                {searchSuggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <button 
          className="header-filter-button"
          onClick={() => navigate('/books')}
        >
          Filtrer votre recherche
        </button>

        <div className="header-user-actions">
          {!isAuthenticated ? (
            <>
              <button className="header-auth-button" onClick={onOpenLogin}>
                Connexion
              </button>
              <button className="header-auth-button header-primary" onClick={onOpenSignup}>
                Inscription
              </button>
            </>
          ) : (
            <div className="header-user-menu">
              <button 
                className="header-menu-button"
                onClick={handleAddBookClick}
              >
                <Plus size={16} className="mr-1" />
                Ajouter
              </button>

              <button 
                className="header-menu-icon"
                onClick={handleFavoritesClick}
                title="Favoris"
              >
                <Heart size={20} />
              </button>

              <button 
                className="header-menu-icon" 
                onClick={handleMessageClick}
                title="Messagerie"
              >
                <MessageCircle size={20} />
                {unreadMessages > 0 && (
                  <span className="header-unread-badge">{unreadMessages}</span> 
                )}
              </button>

              <div 
                className="header-profile-container"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="header-profile-info">
                  <div className="header-avatar-wrapper" onClick={handleProfileClick}>
                    {currentUser?.avatar ? (
                      <img 
                        src={`http://localhost:5001${currentUser.avatar}`} 
                        alt="Avatar" 
                        className="header-profile-avatar"
                      />
                    ) : (
                      getDefaultAvatar(currentUser?.username)
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`header-profile-arrow ${showDropdown ? 'open' : ''}`}
                  />
                </div>

                {showDropdown && (
                  <div className="header-dropdown-menu">
                    <div 
                      className="header-dropdown-item"
                      onClick={() => {
                        navigate('/profile');
                        setShowDropdown(false);
                      }}
                    >
                      <User size={16} className="dropdown-icon" />
                      <span>Mon Profil</span>
                    </div>
                    <div 
                      className="header-dropdown-item"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={16} className="dropdown-icon" />
                      <span>Déconnexion</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;