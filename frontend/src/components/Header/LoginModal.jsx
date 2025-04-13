import React from 'react';
import { X, LogIn } from 'react-feather';
import './LoginModal.css';

const LoginModal = ({ onClose, onLogin, onSwitchToSignup }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
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
        
        <h2 className="modal-title">Se connecter</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Adresse email</label>
            <input
              type="email"
              id="login-email"
              name="email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="login-password">Mot de passe</label>
            <input
              type="password"
              id="login-password"
              name="password"
              required
            />
          </div>
          
          <button type="submit" className="submit-button">
            <LogIn size={16} className="mr-2" />
            Continuer
          </button>
        </form>
        
        <p className="auth-switch">
          Pas de compte ? 
          <button className="text-link" onClick={onSwitchToSignup}>
            S'inscrire
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;