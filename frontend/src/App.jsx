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
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }, [location.pathname]);

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
   

    
    // Gérer la redirection après connexion
    if (location.state?.redirectAfterLogin) {
      navigate(location.state.redirectAfterLogin);
    } else {
      navigate('/');
    }
    
  } catch (error) {
    console.error('Login failed:', error);
    alert(error.response?.data?.error || 'Échec de la connexion');
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
      window.location.reload();
      navigate('/', { state: { fromLogout: true }, replace: true });
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
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={
          <BookDetails 
            currentUser={currentUser} 
            onOpenLogin={() => setActiveModal('login')} 
          />
        } />
        <Route path="/books/:id/edit" element={
          isAuthenticated ? <EditBook /> : <Navigate to="/" />
        } />
        <Route path="/add-book" element={
          isAuthenticated ? <AddBook /> : <Navigate to="/" />
        } />
        <Route path="/profile" element={
          isAuthenticated ? 
            <Profile currentUser={currentUser} /> : 
            <Navigate to="/" state={{ redirectAfterLogin: '/profile' }} />
        } />
        <Route path="/messages" element={
          isAuthenticated ? 
            <Messages currentUser={currentUser} /> : 
            <Navigate to="/" state={{ redirectAfterLogin: '/messages' }} />
        } />
        <Route path="/messages/:conversationId" element={
          isAuthenticated ? 
            <Messages currentUser={currentUser} /> : 
            <Navigate to="/" state={{ redirectAfterLogin: `/messages/${params.conversationId}` }} />
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