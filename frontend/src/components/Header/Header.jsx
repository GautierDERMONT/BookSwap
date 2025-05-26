import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, MessageCircle, User, Plus, LogOut, ChevronDown } from 'react-feather';
import api from '../../services/api';
import './Header.css';
import logo from '../../assets/logo.png';

const Header = ({ isAuthenticated, currentUser, onOpenLogin, onOpenSignup, onLogout }) => {
  // États locaux pour gérer la recherche, le menu déroulant, les messages non lus, et les suggestions de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Hooks de navigation et de localisation de React Router
  const navigate = useNavigate();
  const location = useLocation();

  // Génère un avatar par défaut avec la première lettre du username, et une couleur selon la lettre
  const getDefaultAvatar = (username) => {
    if (!username) return <User size={20} className="header-profile-icon" />;

    const firstLetter = username.charAt(0).toUpperCase();
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3'];
    // Choix de couleur en fonction du code ASCII de la lettre
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

  // Gestion de la soumission du formulaire de recherche
  // Redirige vers la page résultats en fonction de la recherche ou vers la liste complète
  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/books');
    }

    setShowSuggestions(false); // Cacher les suggestions après soumission
  };

  // Bouton "Ajouter un livre" : redirige si authentifié, sinon ouvre la modale login
  const handleAddBookClick = () => {
    isAuthenticated ? navigate('/add-book') : onOpenLogin();
  };

  // Gère le clic sur l'icône "Favoris" : navigation ou demande login
  const handleFavoritesClick = () => {
    if (isAuthenticated) {
      navigate('/favorites');
    } else {
      onOpenLogin();
      navigate('/', { state: { showLogin: true, redirectAfterLogin: '/favorites' } });
    }
  };

  // Gère le clic sur l'icône "Messages" : navigation ou demande login
  const handleMessageClick = () => {
    if (isAuthenticated) {
      navigate('/messages');
    } else {
      onOpenLogin();
      navigate('/', { state: { showLogin: true, redirectAfterLogin: '/messages' } });
    }
  };

  // Gestion du clic sur l'avatar ou profil : navigation ou demande login
  const handleProfileClick = () => {
    isAuthenticated ? navigate('/profile') : onOpenLogin();
  };

  // Gestion du clic déconnexion : appelle la fonction de logout et revient à l’accueil
  const handleLogoutClick = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  // Récupération du nombre de messages non lus depuis l'API
  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/unread-count');
      setUnreadMessages(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus', error);
    }
  };

  // Récupération des suggestions de recherche au fur et à mesure que l'utilisateur tape
  const fetchSearchSuggestions = async (query) => {
    try {
      const response = await api.get(`/books/suggestions?q=${encodeURIComponent(query)}`);
      setSearchSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Effet qui met à jour le nombre de messages non lus à chaque changement d'authentification ou de page
  useEffect(() => {
    isAuthenticated ? fetchUnreadMessages() : setUnreadMessages(0);
  }, [isAuthenticated, location.pathname]);

  // Effet qui récupère les suggestions de recherche dès que la requête dépasse 2 caractères
  useEffect(() => {
    if (searchQuery.length > 2) {
      fetchSearchSuggestions(searchQuery);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  return (
    <header className="header-app">

      {/* Section principale contenant logo, barre de recherche, bouton filtre et actions utilisateur */}
      <div className="header-top">
        
        {/* Logo cliquable qui ramène à la page d'accueil */}
        <Link to="/" className="header-logo-link">
          <img src={logo} alt="BookSwap" className="header-logo" />
        </Link>

        {/* Formulaire de recherche avec suggestions */}
        <form className="header-search-container" onSubmit={handleSearch}>
          <div className="header-search-bar">
            <input
              type="text"
              placeholder="Recherche rapide par titre ou auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)} // Affiche les suggestions au focus
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Cache les suggestions après blur avec délai (pour clic sur suggestion)
            />
            <button type="submit" className="header-search-button">
              <Search size={18} />
            </button>

            {/* Affichage des suggestions seulement si elles existent et si showSuggestions est vrai */}
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

        {/* Bouton pour accéder à la page de filtrage des livres */}
        <button 
          className="header-filter-button"
          onClick={() => navigate('/books')}
        >
          Filtrer votre recherche
        </button>

        {/* Section des actions utilisateurs, connexion/inscription ou menu utilisateur si connecté */}
        <div className="header-user-actions">
          {!isAuthenticated ? (
            <>
              {/* Boutons de connexion et inscription */}
              <button className="header-auth-button" onClick={onOpenLogin}>
                Connexion
              </button>
              <button className="header-auth-button header-primary" onClick={onOpenSignup}>
                Inscription
              </button>
            </>
          ) : (
            <div className="header-user-menu">

              {/* Bouton ajouter un livre */}
              <button 
                className="header-menu-button"
                onClick={handleAddBookClick}
              >
                <Plus size={16} className="mr-1" />
                Ajouter
              </button>

              {/* Icône favoris */}
              <button 
                className="header-menu-icon"
                onClick={handleFavoritesClick}
                title="Favoris"
              >
                <Heart size={20} />
              </button>

              {/* Icône messagerie avec badge nombre messages non lus */}
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

              {/* Menu profil avec avatar et dropdown */}
              <div 
                className="header-profile-container"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="header-profile-info">
                  {/* Affichage de l'avatar utilisateur ou avatar par défaut */}
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
                  {/* Flèche dropdown */}
                  <ChevronDown 
                    size={16} 
                    className={`header-profile-arrow ${showDropdown ? 'open' : ''}`}
                  />
                </div>

                {/* Menu déroulant affiché au survol */}
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
