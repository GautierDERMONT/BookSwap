import axios from 'axios';

// Instance Axios avec cookies et base URL du backend
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true,
});

// Envoi d'un formulaire d'ajout de livre (multipart + timeout)
export const addBook = async (formData) => {
  try {
    const response = await api.post('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
    throw error;
  }
};

export default api;
