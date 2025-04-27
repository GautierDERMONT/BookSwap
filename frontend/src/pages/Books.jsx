// frontend/src/pages/Books.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';


export default function Books() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        setBooks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBooks();
  }, []);

}