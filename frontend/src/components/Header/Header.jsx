import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, MessageCircle, User, Plus, LogOut } from 'react-feather';
import './Header.css';
import logo from '../../assets/logo.png';

const Header = ({ isAuthenticated, currentUser, onOpenLogin, onOpenSignup, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [newFilter, setNewFilter] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const addFilter = () => {
    if (newFilter && !activeFilters.includes(newFilter)) {
      setActiveFilters([...activeFilters, newFilter]);
      setNewFilter('');
    }
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
  };

  const handleAddBookClick = () => {
    if (isAuthenticated) {
      navigate('/add-book');
    } else {
      onOpenLogin();
    }
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
      navigate('/messages', { 
        state: { 
          fromHeader: true,
          redirectAfterLogin: '/messages' 
        } 
      });
    } else {
      onOpenLogin();
      navigate('/', { 
        state: { 
          showLogin: true, 
          redirectAfterLogin: '/messages' 
        } 
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <Link to="/" className="logo-link">
          <img src={logo} alt="BookSwap" className="logo" />
        </Link>

        <form className="search-container" onSubmit={handleSearch}>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher des livres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">
              <Search size={18} />
            </button>
          </div>
        </form>

        <div className="filters-container">
          <div className="filter-input-container">
            <input
              type="text"
              placeholder="Ajouter un filtre (ex: Roman, Paris, Neuf...)"
              value={newFilter}
              onChange={(e) => setNewFilter(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFilter()}
            />
            <button onClick={addFilter} className="add-filter-button">
              <Plus size={16} />
            </button>
          </div>

          {activeFilters.map((filter) => (
            <div key={filter} className="active-filter">
              {filter}
              <button 
                onClick={() => removeFilter(filter)} 
                className="remove-filter"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="user-actions">
          {!isAuthenticated ? (
            <>
              <button className="auth-button" onClick={onOpenLogin}>
                Connexion
              </button>
              <button className="auth-button primary" onClick={onOpenSignup}>
                Inscription
              </button>
            </>
          ) : (
            <div className="user-menu">
              <button 
                className="menu-button"
                onClick={handleAddBookClick}
              >
                <Plus size={16} className="mr-1" />
                Ajouter
              </button>

              <button 
                className="menu-icon"
                onClick={handleFavoritesClick}
                title="Favoris"
              >
                <Heart size={20} />
              </button>

              <button 
                className="menu-icon" 
                onClick={handleMessageClick}
                title="Messagerie"
              >
                <MessageCircle size={20} />
              </button>

              <div 
                className="profile-container"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="profile-info">
                  <User size={20} className="profile-icon" />
                  <span className="username">{currentUser?.username}</span>
                </div>
                
                {showDropdown && (
                  <button className="logout-button" onClick={handleLogoutClick}>
                    <LogOut size={16} className="mr-1" />
                    Déconnexion
                  </button>
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
