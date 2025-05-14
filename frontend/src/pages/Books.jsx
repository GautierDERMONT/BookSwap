// frontend/src/pages/Books.jsx
import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import BookCard from '../components/BookCard';
import './Books.css';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    conditions: [],
    locations: [],
    searchQuery: ''
  });
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        const booksData = res.data.books;
        setBooks(booksData);
        setFilteredBooks(booksData);
        
        // Extraire les options uniques pour les filtres
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
    // Gérer les clics en dehors des suggestions
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Générer des suggestions de recherche
    if (filters.searchQuery.length > 1) {
      const query = filters.searchQuery.toLowerCase();
      const suggestions = [
        ...new Set([
          ...books.filter(book => 
            book.title.toLowerCase().includes(query)
          ).map(book => book.title),
          ...books.filter(book => 
            book.author.toLowerCase().includes(query)
          ).map(book => book.author)
        ])
      ].slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [filters.searchQuery, books]);

  useEffect(() => {
    // Appliquer les filtres et le tri
    let result = [...books];
    
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
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(query) || 
        book.author.toLowerCase().includes(query)
      );
    }

    // Appliquer le tri
    result = sortBooks(result, sortOption);
    
    setFilteredBooks(result);
  }, [filters, books, sortOption]);

  const sortBooks = (booksToSort, option) => {
    const sorted = [...booksToSort];
    switch(option) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'author-asc':
        return sorted.sort((a, b) => a.author.localeCompare(b.author));
      case 'author-desc':
        return sorted.sort((a, b) => b.author.localeCompare(a.author));
      default:
        return sorted;
    }
  };

  const handleFilterChange = (filterName, value, isChecked) => {
    setFilters(prev => {
      const currentFilters = [...prev[filterName]];
      if (isChecked) {
        return {
          ...prev,
          [filterName]: [...currentFilters, value]
        };
      } else {
        return {
          ...prev,
          [filterName]: currentFilters.filter(item => item !== value)
        };
      }
    });
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: e.target.value
    }));
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: suggestion
    }));
    setShowSuggestions(false);
  };

  const resetFilters = () => {
    setFilters({
      categories: [],
      conditions: [],
      locations: [],
      searchQuery: ''
    });
    setSortOption('newest');
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="books-page">
      <div className="filters-container">
        <div className="search-filter" ref={searchRef}>
          <input
            type="text"
            placeholder="Rechercher par titre ou auteur..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="suggestion-item"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="filter-group">
          <label>Catégories</label>
          <div className="checkbox-group">
            {categories.map(category => (
              <label key={category} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={(e) => handleFilterChange('categories', category, e.target.checked)}
                />
                {category}
              </label>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label>États</label>
          <div className="checkbox-group">
            {conditions.map(condition => (
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
          <label>Localisations</label>
          <div className="checkbox-group">
            {locations.map(location => (
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
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
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
        <p>{filteredBooks.length} livre(s) trouvé(s)</p>
      </div>

      <div className="book-list">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))
        ) : (
          <p className="no-results">Aucun livre ne correspond aux critères de recherche</p>
        )}
      </div>
    </div>
  );
}