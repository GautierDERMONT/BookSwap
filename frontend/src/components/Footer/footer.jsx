import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left">
            <strong>ZGM Book</strong> — Échangez des livres avec votre communauté locale
          </div>
          <div className="footer-links">
            <a href="#mentions-legales" onClick={(e) => { e.preventDefault(); openModal('mentions-legales'); }}>Mentions légales</a>
            <span>|</span>
            <a href="#confidentialite" onClick={(e) => { e.preventDefault(); openModal('confidentialite'); }}>Confidentialité</a>
            <span>|</span>
            <a href="#cgu" onClick={(e) => { e.preventDefault(); openModal('cgu'); }}>CGU</a>
          </div>
          <div className="footer-right">
            &copy; {new Date().getFullYear()} BookSwap - Projet scolaire
          </div>
        </div>
      </footer>

      {/* Modal Mentions légales */}
      {activeModal === 'mentions-legales' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h2>Mentions légales</h2>
            <div className="modal-text-content">
              <p><strong>Éditeur du site :</strong></p>
              <p>ZGM Book</p>
              <p>Projet scolaire - Bachelor Informatique</p>
              <p>Ce site est une simulation et n'a pas d'existence réelle</p>
              <p>Année académique 2024-2025</p>
              
              <p><strong>Hébergement :</strong></p>
              <p>Railway</p>
              
              
              <p><strong>Contact :</strong></p>
              <p>gautier.dermont1@gmail.com</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confidentialité */}
      {activeModal === 'confidentialite' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h2>Politique de confidentialité</h2>
            <div className="modal-text-content">
              <p><strong>1. Données collectées</strong></p>
              <p>Email, nom d'utilisateur, et sur les livres échangé.</p>
              
              
              <p><strong>2. Utilisation des données</strong></p>
              <p>Vos données sont utilisées pour le fonctionnement de la plateforme d'échange de livres.</p>
          
              <p><strong>3. Conservation des données</strong></p>
              <p>Ce projet scolaire ne conserve pas réellement vos données.
                  Aucune donnée n'est partagée avec des tiers.    </p>
              <p>Données supprimées à la fermeture du compte.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal CGU */}
      {activeModal === 'cgu' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h2>Conditions Générales d'Utilisation</h2>
            <div className="modal-text-content">
              <p>ZGM Book est une plateforme d'échange de livres entre particuliers.</p>
              
              <p>Projet scolaire à but non lucratif.</p>

              <p>Les utilisateurs s'engagent à échanger des livres légaux et en bon état.</p>
              
              <p>La plateforme n'est pas responsable des échanges entre utilisateurs.</p>

              <p>Tout contenu inapproprié sera supprimé.</p>


            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;