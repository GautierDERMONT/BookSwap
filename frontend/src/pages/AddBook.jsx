import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, X, Upload } from 'react-feather';
import './AddBook.css';

const API_URL = 'http://localhost:5001';

const AddBook = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    condition: '',
    location: '',
    description: '',
    availability: 'Disponible'
  });

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/profile`, {
          withCredentials: true
        });
        if (response.data.location) {
          setFormData(prev => ({
            ...prev,
            location: response.data.location
          }));
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du profil:", err);
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    return () => {
      images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [images]);

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    const MAX_FILES = 3;

    const validFiles = files
      .filter(file => {
        if (!file.type.startsWith('image/')) {
          setError('Veuillez choisir uniquement des images.');
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`Le fichier ${file.name} est trop volumineux (max 20MB)`);
          return false;
        }
        return true;
      })
      .slice(0, MAX_FILES - images.length);

    if (validFiles.length) {
      const newImages = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages([...images, ...newImages]);
      setError(null);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    if (name === 'description' && countWords(value) > 100) {
      return;
    }
  
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    const requiredFields = ['title', 'author', 'category', 'condition', 'location', 'description'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim().length === 0);
  
    if (missingFields.length > 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      setIsSubmitting(false);
      return;
    }
  
    if (images.length === 0) {
      setError('Veuillez ajouter au moins une image');
      setIsSubmitting(false);
      return;
    }
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('author', formData.author.trim());
      formDataToSend.append('category', formData.category.trim());
      formDataToSend.append('condition', formData.condition.trim());
      formDataToSend.append('location', formData.location.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('availability', formData.availability);

      images.forEach(({ file }) => {
        formDataToSend.append('images', file);
      });

      await axios.post(`${API_URL}/api/books`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      navigate('/profile', { state: { scrollToBooks: true } });
    } catch (err) {
      console.error('Erreur lors de l\'ajout du livre:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout du livre');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-book-container">
      <h2>Ajouter un livre que vous souhaitez échanger</h2>
      {error && <div className="alert error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div
          className={`image-upload ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <label htmlFor="file-input">
            <div className="upload-area">
              <Upload size={40} className="upload-icon" />
              <p>Glissez-déposez vos images ici ou cliquez pour sélectionner</p>
              <p>(3 maximum)</p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          </label>
        </div>

        {images.length > 0 && (
          <div className="preview-container">
            {images.map((image, index) => (
              <div key={index} className="preview-item">
                <img
                  src={image.preview}
                  alt={`Preview ${index}`}
                  className="preview-image"
                  loading="lazy"
                />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {images.length < 3 && (
              <label htmlFor="file-input" className="add-more">
                <Plus size={24} />
                <span>Ajouter</span>
              </label>
            )}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              minLength="2"
            />
          </div>
          <div className="form-group">
            <label>Auteur *</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Catégorie *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>État *</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="Neuf">Neuf</option>
              <option value="Très bon état">Très bon état</option>
              <option value="Bon état">Bon état</option>
              <option value="Usagé">Usagé</option>
            </select>
          </div>
        </div>
       
        <div className="form-row">
          <div className="form-group">
            <label>Lieu *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Disponibilité *</label>
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              required
            >
              <option value="Disponible">Disponible</option>
              <option value="Réservé">Réservé</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
          />
          <small>{countWords(formData.description)} / 100 mots</small>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publication en cours...' : 'Publier le livre'}
        </button>
      </form>
    </div>
  );
};

export default AddBook;