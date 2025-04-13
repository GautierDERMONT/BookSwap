import React from 'react';
import { X } from 'react-feather';
import './LoginModal.css';

const SignupModal = ({ onClose, onSignup, onSwitchToLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSignup({
      username: e.target.username.value,
      email: e.target.email.value,
      password: e.target.password.value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 className="modal-title">Créer un compte</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-username">Nom d'utilisateur</label>
            <input
              type="text"
              id="signup-username"
              name="username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="signup-email">Adresse email</label>
            <input
              type="email"
              id="signup-email"
              name="email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="signup-password">Mot de passe</label>
            <input
              type="password"
              id="signup-password"
              name="password"
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" className="submit-button">
            Continuer
          </button>
        </form>
        
        <p className="auth-switch">
          Déjà un compte ? 
          <button className="text-link" onClick={onSwitchToLogin}>
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupModal;