// Importation des modules et composants nécessaires
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header/Header';
import LoginModal from './components/Header/LoginModal';
import SignupModal from './components/Header/SignupModal';
import HomePage from './pages/Home';
import BooksPage from './pages/Books';
import AddBook from './pages/AddBook';
import BookDetails from './pages/BookDetails';
import EditBook from './pages/EditBook';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import SearchResults from './pages/SearchResults';
import Favorites from './pages/Favorites';
import Footer from './components/Footer/Footer';
import './App.css';

// Liste des routes protégées qui nécessitent une authentification
const protectedRoutes = [
  '/add-book',
  '/profile',
  '/messages',
  '/favorites',
  '/books/:id/edit'
];

function App() {
  // États de l'application
  const [isAuthenticated, setIsAuthenticated] = useState(false); // état de connexion
  const [currentUser, setCurrentUser] = useState(null);           // infos utilisateur connecté
  const [activeModal, setActiveModal] = useState(null);           // modal actif : login ou signup
  const [loading, setLoading] = useState(true);                   // état de chargement de l'app
  const [pendingAction, setPendingAction] = useState(null);       // action à exécuter après login

  // Hooks de navigation et de localisation
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Effet secondaire : scroll en haut de la page à chaque changement de route
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Vérifie l'état d'authentification de l'utilisateur à chaque changement de route ou d'action différée
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/auth/me', { 
          withCredentials: true,
          validateStatus: (status) => status < 500
        });

        if (response.status === 200) {
          setIsAuthenticated(true);
          setCurrentUser(response.data);
          if (pendingAction) {
            pendingAction(); // Exécute l'action différée après connexion
            setPendingAction(null);
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname, pendingAction]);

  // Fonction de connexion
  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post(
        'http://localhost:5001/api/auth/login', 
        credentials,
        { withCredentials: true }
      );

      // Enregistre l'utilisateur et ferme la modal
      setIsAuthenticated(true);
      setCurrentUser({
        id: response.data.userId,
        username: response.data.username,
        email: response.data.email,
        avatar: response.data.avatar
      });
      setActiveModal(null);

      // Redirections spécifiques après login
      if (location.state?.isOwnerRedirect) {
        navigate(`/books/${location.state.bookId}/edit`, { replace: true });
      }
      else if (location.state?.fromMessage) {
        navigate('/messages', { 
          state: { 
            bookId: location.state.bookId,
            recipientId: location.state.recipientId,
            bookInfo: location.state.bookInfo,
            interlocutor: location.state.interlocutor
          },
          replace: true
        });
      }
      else if (location.pathname.startsWith('/user/') && response.data.userId === location.pathname.split('/')[2]) {
        navigate('/profile', { replace: true });
      }
      else if (location.state?.redirectAfterLogin) {
        navigate(location.state.redirectAfterLogin, { replace: true });
      } else {
        navigate(location.pathname, { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert(error.response?.data?.error || 'Échec de la connexion');
    }
  };

  // Fonction pour exécuter une action après authentification
  const executeAfterAuth = (action) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setActiveModal('login');
      navigate(location.pathname, {
        state: { redirectAfterLogin: location.pathname }
      });
    }
  };

  // Fonction d'inscription
  const handleSignup = async (userData) => {
    try {
      await axios.post('http://localhost:5001/api/auth/register', {
        username: userData.username,
        email: userData.email,
        password: userData.password
      });
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      setActiveModal('login');
    } catch (error) {
      console.error('Signup failed:', error);
      alert(error.response?.data?.error || 'Échec de l\'inscription');
    }
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:5001/api/auth/logout',
        {},
        { withCredentials: true }
      );

      setIsAuthenticated(false);
      setCurrentUser(null);
      setPendingAction(null);

      // Redirection vers l'accueil si l'utilisateur est sur une page protégée
      const isProtected = protectedRoutes.some(route => {
        const regex = new RegExp('^' + route.replace(/:\w+/g, '\\w+') + '$');
        return regex.test(location.pathname);
      });

      if (isProtected) {
        navigate('/', { replace: true });
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Affiche un écran de chargement pendant la vérification de session
  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <div className="app">
      {/* En-tête du site */}
      <Header
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onOpenLogin={() => setActiveModal('login')}
        onOpenSignup={() => setActiveModal('signup')}
        onLogout={handleLogout}
      />

      {/* Contenu principal avec les routes */}
      <main className="app-content">
        <Routes>
          {/* Route d'accueil */}
          <Route path="/" element={
            <HomePage 
              isAuthenticated={isAuthenticated} 
              currentUser={currentUser} 
              onOpenLogin={() => setActiveModal('login')} 
            />
          } />

          {/* Liste des livres */}
          <Route path="/books" element={
            <BooksPage 
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              onOpenLogin={() => setActiveModal('login')}
            />
          } />

          {/* Détails d'un livre */}
          <Route path="/books/:id" element={
            <BookDetails 
              currentUser={currentUser}
              executeAfterAuth={executeAfterAuth}
            />
          } />

          {/* Modifier un livre - protégé */}
          <Route path="/books/:id/edit" element={
            isAuthenticated ? <EditBook /> : <Navigate to="/" replace />
          } />

          {/* Ajouter un livre - protégé */}
          <Route path="/add-book" element={
            isAuthenticated ? <AddBook /> : <Navigate to="/" replace />
          } />

          {/* Profil personnel - protégé */}
          <Route path="/profile" element={
            isAuthenticated ? 
              <Profile currentUser={currentUser} executeAfterAuth={executeAfterAuth} /> : 
              <Navigate to="/" state={{ redirectAfterLogin: '/profile' }} replace />
          } />

          {/* Messagerie - protégé */}
          <Route path="/messages" element={
            isAuthenticated ? 
              <Messages currentUser={currentUser} /> : 
              <Navigate to="/" state={{ redirectAfterLogin: '/messages' }} replace />
          } />

          {/* Conversation spécifique - protégé */}
          <Route path="/messages/:conversationId" element={
            isAuthenticated ? 
              <Messages currentUser={currentUser} isAuthenticated={isAuthenticated} /> : 
              <Navigate to="/" state={{ redirectAfterLogin: `/messages/${params.conversationId}` }} replace />
          } />

          {/* Résultats de recherche */}
          <Route path="/search" element={
            <SearchResults 
              isAuthenticated={isAuthenticated} 
              currentUser={currentUser} 
              executeAfterAuth={executeAfterAuth}
            />
          } />

          {/* Profil public d'un autre utilisateur */}
          <Route path="/user/:userId" element={
            <Profile 
              currentUser={currentUser} 
              isPublicProfile={true} 
              executeAfterAuth={executeAfterAuth}
            />
          } />

          {/* Favoris - protégé */}
          <Route path="/favorites" element={
            isAuthenticated ?
              <Favorites currentUser={currentUser} /> :
              <Navigate to="/" state={{ redirectAfterLogin: '/favorites' }} replace />
          } />
        </Routes>
      </main>

      {/* Pied de page */}
      <Footer />

      {/* Modale de connexion */}
      {activeModal === 'login' && (
        <LoginModal
          onClose={() => setActiveModal(null)}
          onLogin={handleLogin}
          onSwitchToSignup={() => setActiveModal('signup')}
        />
      )}

      {/* Modale d'inscription */}
      {activeModal === 'signup' && (
        <SignupModal
          onClose={() => setActiveModal(null)}
          onSignup={handleSignup}
          onSwitchToLogin={() => setActiveModal('login')}
        />
      )}
    </div>
  );
}

export default App;
