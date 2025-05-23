import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-left">
          <strong>ZGM Book</strong> — Échangez des livres avec votre communauté locale
        </div>
        <div className="footer-links">
          <Link to="/mentions-legales">Mentions légales</Link>
          <span>|</span>
          <Link to="/politique-de-confidentialite">Confidentialité</Link>
          <span>|</span>
          <Link to="/conditions-generales">CGU</Link>
        </div>
        <div className="footer-right">
          &copy; {new Date().getFullYear()} BookSwap - Projet scolaire
        </div>
      </div>
    </footer>
  );
};

export default Footer;
