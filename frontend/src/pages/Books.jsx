import { useEffect, useState } from 'react';
import api from '../services/api';
import BookCard from '../components/BookCard';
import { Search } from 'react-feather';
import './Books.css';

export default function Books({ isAuthenticated, currentUser, onOpenLogin }) {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    conditions: [],
    locations: []
  });
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [conditionSearch, setConditionSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        const booksData = res.data.books;
        setBooks(booksData);
        
        const uniqueCategories = [...new Set(booksData.map(book => book.category))];
        const uniqueConditions = [...new Set(booksData.map(book => book.condition))];
        const uniqueLocations = [...new Set(booksData.map(book => book.location))];
        
        setCategories(uniqueCategories);
        setConditions(uniqueConditions);
        setLocations(uniqueLocations);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des livres');
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      let result = [...books];
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(book => 
          book.title.toLowerCase().includes(query) || 
          book.author.toLowerCase().includes(query)
        );
      }
      
      if (filters.categories.length > 0) {
        result = result.filter(book => filters.categories.includes(book.category));
      }
      
      if (filters.conditions.length > 0) {
        result = result.filter(book => filters.conditions.includes(book.condition));
      }
      
      if (filters.locations.length > 0) {
        result = result.filter(book => 
          filters.locations.some(location => book.location.includes(location))
        );
      }

      result = sortBooks(result, sortOption);
      setFilteredBooks(result);
    }, 300);

    setSearchTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [searchQuery, filters, books, sortOption]);

  const sortBooks = (booksToSort, option) => {
    const sorted = [...booksToSort];
    switch(option) {
      case 'newest': return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest': return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'title-asc': return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc': return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'author-asc': return sorted.sort((a, b) => a.author.localeCompare(b.author));
      case 'author-desc': return sorted.sort((a, b) => b.author.localeCompare(a.author));
      default: return sorted;
    }
  };

  const handleFilterChange = (filterName, value, isChecked) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: isChecked 
        ? [...prev[filterName], value] 
        : prev[filterName].filter(item => item !== value)
    }));
  };

  const resetFilters = () => {
    setFilters({ categories: [], conditions: [], locations: [] });
    setSortOption('newest');
    setSearchQuery('');
    setCategorySearch('');
    setConditionSearch('');
    setLocationSearch('');
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="books-page">
      <div className="books-search-container">
        <div className="books-search-bar">
          <input
            type="text"
            placeholder="Rechercher par titre ou auteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="books-search-icon" />
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <div className="filter-header">
            <label>Catégories</label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="filter-search"
            />
          </div>
            <div className="scrollable-checkbox-group">
              {categories
                .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                .map(category => (
                  <label key={category} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={(e) => handleFilterChange('categories', category, e.target.checked)}
                    />
                    <span className="checkbox-text">{category}</span>
                  </label>
                ))}
            </div>
        </div>
        
        <div className="filter-group">
          <div className="filter-header">
            <label>États</label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={conditionSearch}
              onChange={(e) => setConditionSearch(e.target.value)}
              className="filter-search"
            />
          </div>
          <div className="scrollable-checkbox-group">
            {conditions
              .filter(cond => cond.toLowerCase().includes(conditionSearch.toLowerCase()))
              .map(condition => (
                <label key={condition} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.conditions.includes(condition)}
                    onChange={(e) => handleFilterChange('conditions', condition, e.target.checked)}
                  />
                  {condition}
                </label>
              ))}
          </div>
        </div>
        
        <div className="filter-group">
          <div className="filter-header">
            <label>Localisations</label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="filter-search"
            />
          </div>
          <div className="scrollable-checkbox-group">
            {locations
              .filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase()))
              .map(location => (
                <label key={location} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.locations.includes(location)}
                    onChange={(e) => handleFilterChange('locations', location, e.target.checked)}
                  />
                  {location}
                </label>
              ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label>Trier par</label>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="newest">Plus récent</option>
            <option value="oldest">Plus ancien</option>
            <option value="title-asc">Titre (A-Z)</option>
            <option value="title-desc">Titre (Z-A)</option>
            <option value="author-asc">Auteur (A-Z)</option>
            <option value="author-desc">Auteur (Z-A)</option>
          </select>
        </div>
        
        <button onClick={resetFilters} className="reset-filters">
          Réinitialiser tout
        </button>
      </div>

      <div className="results-info">
        {searchQuery && (
          <p>Résultats pour : "{searchQuery}"</p>
        )}
        <p>{filteredBooks.length} livre(s) trouvé(s)</p>
      </div>

      <div className="book-list">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <BookCard 
              key={book.id} 
              book={book}
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              onRequireLogin={onOpenLogin}
            />
          ))
        ) : (
          <p className="no-results">Aucun livre ne correspond aux critères de recherche</p>
        )}
      </div>
    </div>
  );
}