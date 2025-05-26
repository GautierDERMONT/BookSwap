import axios from 'axios';

// Instance axios configurée pour communiquer avec le backend et envoyer les cookies
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true,
});

// Fonction pour envoyer un formulaire avec ajout de livre, gestion timeout et headers multipart
export const addBook = async (formData) => {
  try {
    const response = await api.post('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    // Log détaillé en cas d’erreur
    console.error('Error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
    throw error;
  }
};

export default api;
