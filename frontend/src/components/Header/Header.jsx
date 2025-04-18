import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, MessageCircle, User, Plus } from 'react-feather';
import './Header.css';
import logo from '../../assets/logo.png'; // Chemin ajusté


const Header = ({ isAuthenticated, onOpenLogin, onOpenSignup }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [newFilter, setNewFilter] = useState('');

  const addFilter = () => {
    if (newFilter && !activeFilters.includes(newFilter)) {
      setActiveFilters([...activeFilters, newFilter]);
      setNewFilter('');
    }
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <Link to="/" className="logo-link">
          <img src={logo} alt="BookSwap" className="logo" />
        </Link>


        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher des livres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-button">
              <Search size={18} />
            </button>
          </div>
        </div>

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
              <button className="menu-button">
                <Plus size={16} className="mr-1" />
                Ajouter
              </button>
              <button className="menu-icon">
                <Heart size={20} />
              </button>
              <button className="menu-icon">
                <MessageCircle size={20} />
              </button>
              <button className="menu-icon">
                <User size={20} />
              </button>
            </div>
          )}
        </div>
      </div>


    </header>
  );
};

export default Header;