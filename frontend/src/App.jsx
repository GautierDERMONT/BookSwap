import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5001/api/auth/me', { 
      withCredentials: true 
    })
    .then(response => {
      setIsAuthenticated(true);
      setCurrentUser(response.data);
      
      if (location.state?.redirectAfterLogin && !location.state?.fromLogout) {
        navigate(location.state.redirectAfterLogin);
      }
    })
    .catch(() => {});
  }, [location]);

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post(
        'http://localhost:5001/api/auth/login', 
        credentials,
        { withCredentials: true }
      );
      
      setIsAuthenticated(true);
      setCurrentUser({
        username: response.data.username,
        email: response.data.email,
        userId: response.data.userId
      });
      setActiveModal(null);
      
      if (location.state?.redirectAfterLogin) {
        navigate(location.state.redirectAfterLogin);
      } else {
        window.location.reload();
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
      navigate('/', { state: { fromLogout: true }, replace: true });
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
        <Route path="/books/:id/edit" element={isAuthenticated ? <EditBook /> : <Navigate to="/" />} />
        <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} currentUser={currentUser} onOpenLogin={() => setActiveModal('login')} />} />
        <Route path="/messages" element={isAuthenticated ? <Messages currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/" state={{ from: '/messages' }} />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetails currentUser={currentUser} onOpenLogin={() => setActiveModal('login')} />} />
        <Route path="/add-book" element={isAuthenticated ? <AddBook /> : <Navigate to="/" />} />
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