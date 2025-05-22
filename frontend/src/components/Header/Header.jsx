import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, MessageCircle, User, Plus, LogOut, ChevronDown } from 'react-feather';
import api from '../../services/api';
import './Header.css';
import logo from '../../assets/logo.png';

const Header = ({ isAuthenticated, currentUser, onOpenLogin, onOpenSignup, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    location: [],
    condition: [],
    genre: []
  });
  const [newFilter, setNewFilter] = useState({
    type: 'location',
    value: ''
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const conditionOptions = ['Neuf', 'Très bon état', 'Bon état', 'Usagé'];

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

  const addFilter = () => {
    const trimmedValue = newFilter.value.trim();
    if (!trimmedValue) return;

    setActiveFilters((prev) => ({
      ...prev,
      [newFilter.type]: [trimmedValue]
    }));
    setNewFilter({ ...newFilter, value: '' });
  };

  const removeFilter = (type) => {
    setActiveFilters({
      ...activeFilters,
      [type]: []
    });
  };

  const handleFilterTypeChange = (type) => {
    setNewFilter({ ...newFilter, type, value: '' });
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
      navigate('/messages', { state: { fromHeader: true, redirectAfterLogin: '/messages' } });
    } else {
      onOpenLogin();
      navigate('/', { state: { showLogin: true, redirectAfterLogin: '/messages' } });
    }
  };

  const handleProfileClick = () => {
    isAuthenticated ? navigate('/profile') : onOpenLogin();
  };


const handleSearch = (e) => {
  e.preventDefault();
  const queryParams = new URLSearchParams();

  // Ajouter le terme de recherche seulement s'il n'est pas vide
  if (searchQuery.trim()) {
    queryParams.append('q', searchQuery.trim());
  }

  // Ajouter les filtres actifs
  if (activeFilters.location.length > 0) {
    queryParams.append('location', activeFilters.location[0]);
  }
  if (activeFilters.condition.length > 0) {
    queryParams.append('condition', activeFilters.condition[0]);
  }
  if (activeFilters.genre.length > 0) {
    queryParams.append('genre', activeFilters.genre[0]);
  }

  // Naviguer seulement s'il y a soit un terme de recherche, soit des filtres
  if (searchQuery.trim() || Object.values(activeFilters).some(filters => filters.length > 0)) {
    navigate(`/search?${queryParams.toString()}`);
    setShowSuggestions(false);
  }
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
              placeholder="Rechercher des livres..."
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

        <div className="header-filters-container">
          <div className="header-filter-input-container">
            <select
              value={newFilter.type}
              onChange={(e) => handleFilterTypeChange(e.target.value)}
              className="header-filter-type-select"
            >
              <option value="location">Localisation</option>
              <option value="condition">État</option>
              <option value="genre">Catégorie</option>
            </select>
            
            {newFilter.type === 'condition' ? (
              <select
                value={newFilter.value}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                className="header-filter-value-select"
              >
                <option value="">Sélectionner un état</option>
                {conditionOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={newFilter.type === 'location' 
                  ? "Ajouter une localisation..." 
                  : "Ajouter une catégorie..."}
                value={newFilter.value}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && addFilter()}
                className="header-filter-value-input"
              />
            )}
            
            <button 
              onClick={addFilter} 
              className="header-add-filter-button"
              disabled={!newFilter.value}
            >
              <Plus size={16} />
            </button>
          </div>

          {Object.values(activeFilters).some(filters => filters.length > 0) && (
            <div className="header-active-filters-wrapper">
              {Object.entries(activeFilters).map(([type, filters]) => (
                filters.length > 0 && (
                  <div key={type} className="header-filter-category">
                    <span className="header-filter-category-label">
                      {type === 'location' ? 'Localisation:' : 
                       type === 'condition' ? 'État:' : 'Genre:'}
                    </span>
                    <div className="header-active-filter">
                      {filters[0]}
                      <button 
                        onClick={() => removeFilter(type)} 
                        className="header-remove-filter"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

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