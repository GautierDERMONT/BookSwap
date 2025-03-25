import Books from './pages/Books';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">BookSwap</h1>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Books />  {/* Votre composant de catalogue */}
      </main>

      {/* Pied de page */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <p className="text-center text-gray-500">
            © 2023 BookSwap - Plateforme d'échange de livres
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;