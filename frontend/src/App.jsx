import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import LoginModal from './components/Header/LoginModal'
import SignupModal from './components/Header/SignupModal'
import HomePage from './pages/Home' // Créez cette page
import BooksPage from './pages/Books' // Créez cette page

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeModal, setActiveModal] = useState(null)

  const handleLogin = (credentials) => {
    console.log('Login attempt:', credentials)
    setIsAuthenticated(true)
    setActiveModal(null)
  }

  const handleSignup = (userData) => {
    console.log('Signup attempt:', userData)
    setIsAuthenticated(true)
    setActiveModal(null)
  }

  return (
    <div className="app">
      <Header
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => setActiveModal('login')}
        onOpenSignup={() => setActiveModal('signup')}
      />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
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
  )
}

export default App