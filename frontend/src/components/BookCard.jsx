// frontend/src/components/BookCard.jsx
import './BookCard.css'; // Fichier CSS dédié

export default function BookCard({ book }) {
  return (
    <div className="book-card">
      <img 
        src={book.image_url || 'https://via.placeholder.com/150'} 
        alt={book.title}
        className="book-image"
      />
      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="author">{book.author}</p>
      </div>
    </div>
  );
}