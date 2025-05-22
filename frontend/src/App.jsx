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
import './App.css';
import Favorites from './pages/Favorites';

const protectedRoutes = [
  '/add-book',
  '/profile',
  '/messages',
  '/favorites',
  '/books/:id/edit'
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

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
            pendingAction();
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

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post(
        'http://localhost:5001/api/auth/login', 
        credentials,
        { withCredentials: true }
      );

      setIsAuthenticated(true);
      setCurrentUser({
        id: response.data.userId,
        username: response.data.username,
        email: response.data.email,
        avatar: response.data.avatar
      });
      setActiveModal(null);

      // Cas 1: Redirection vers l'édition si c'est le propriétaire du livre
      if (location.state?.isOwnerRedirect) {
        navigate(`/books/${location.state.bookId}/edit`, { replace: true });
      }
      // Cas 2: Redirection vers la messagerie pour une nouvelle conversation
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
      // Cas 3: Redirection vers le profil si sur sa propre page publique
      else if (location.pathname.startsWith('/user/') && response.data.userId === location.pathname.split('/')[2]) {
        navigate('/profile', { replace: true });
      }
      // Cas par défaut
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

  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  return (
    <div className="app">
      <Header
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onOpenLogin={() => setActiveModal('login')}
        onOpenSignup={() => setActiveModal('signup')}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={
          <HomePage 
            isAuthenticated={isAuthenticated} 
            currentUser={currentUser} 
            onOpenLogin={() => setActiveModal('login')} 
          />
        } />
        <Route path="/books" element={<BooksPage executeAfterAuth={executeAfterAuth} />} />
        <Route path="/books/:id" element={
          <BookDetails 
            currentUser={currentUser}
            executeAfterAuth={executeAfterAuth}
          />
        } />
        <Route path="/books/:id/edit" element={
          isAuthenticated ? <EditBook /> : <Navigate to="/" replace />
        } />
        <Route path="/add-book" element={
          isAuthenticated ? <AddBook /> : <Navigate to="/" replace />
        } />
        <Route path="/profile" element={
          isAuthenticated ? 
            <Profile currentUser={currentUser} executeAfterAuth={executeAfterAuth} /> : 
            <Navigate to="/" state={{ redirectAfterLogin: '/profile' }} replace />
        } />
        
        <Route path="/messages" element={
          isAuthenticated ? 
            <Messages currentUser={currentUser} /> : 
            <Navigate to="/" state={{ redirectAfterLogin: '/messages' }} replace />
        } />
        <Route path="/messages/:conversationId" element={
          isAuthenticated ? 
            <Messages currentUser={currentUser} isAuthenticated={isAuthenticated} /> : 
            <Navigate to="/" state={{ redirectAfterLogin: `/messages/${params.conversationId}` }} replace />
        } />

        <Route path="/search" element={
          <SearchResults 
            isAuthenticated={isAuthenticated} 
            currentUser={currentUser} 
            executeAfterAuth={executeAfterAuth}
          />
        } />
        <Route path="/user/:userId" element={
          <Profile 
            currentUser={currentUser} 
            isPublicProfile={true} 
            executeAfterAuth={executeAfterAuth}
          />
        } />

        <Route path="/favorites" element={
          isAuthenticated ?
            <Favorites currentUser={currentUser} /> :
            <Navigate to="/" state={{ redirectAfterLogin: '/favorites' }} replace />
        } />
      </Routes>

      {activeModal === 'login' && (
        <LoginModal
          onClose={() => setActiveModal(null)}
          onLogin={handleLogin}
          onSwitchToSignup={() => setActiveModal('signup')}
        />
      )}

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