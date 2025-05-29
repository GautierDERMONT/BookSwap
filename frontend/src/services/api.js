import axios from 'axios';

// Instance Axios configurée pour le frontend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Exemple de requête avec gestion d'erreur
export const addBook = async (formData) => {
  try {
    const response = await api.post('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
    });
    throw error;
  }
};

export default api;