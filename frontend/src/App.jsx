import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header/Header';
import LoginModal from './components/Header/LoginModal';
import SignupModal from './components/Header/SignupModal';
import HomePage from './pages/Home';
import BooksPage from './pages/Books';
import AddBook from './pages/AddBook';
import { Navigate } from 'react-router-dom';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setIsAuthenticated(true);
        setCurrentUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setCurrentUser({
        username: response.data.username,
        email: response.data.email
      });
      setActiveModal(null);
      window.location.reload();

    } catch (error) {
      console.error('Login failed:', error.response?.data?.error || error.message);
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
      window.location.reload();

    } catch (error) {
      console.error('Signup failed:', error.response?.data?.error || error.message);
      alert(error.response?.data?.error || 'Échec de l\'inscription');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.clear();  // Supprimer les favoris à la déconnexion
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.reload();

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
      
          <Route 
            path="/" 
            element={
              <HomePage 
                isAuthenticated={isAuthenticated} 
                currentUser={currentUser}         // ✅ AJOUTE ÇA
                onOpenLogin={() => setActiveModal('login')} 
              />
            } 
          />
        <Route path="/books" element={<BooksPage />} />
        <Route 
          path="/add-book" 
          element={
            isAuthenticated ? (
              <AddBook />
            ) : (
              <Navigate to="/" />
            )
          } 
        />
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