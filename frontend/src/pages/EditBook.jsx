import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import { Plus, X, Upload, Loader } from 'react-feather';
import './AddBook.css';

const API_URL = 'http://localhost:5001';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    condition: '',
    location: '',
    description: '',
    availability: 'Disponible'
  });


  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  useEffect(() => {
    const fetchBookData = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/books/${id}`);
        const book = data.book;
        
        setFormData({
          title: book.title,
          author: book.author,
          category: book.category,
          condition: book.condition,
          location: book.location,
          description: book.description,
          availability: book.availability
        });
        if (book.images && book.images.length > 0) {
                setExistingImages(book.images.map(img => ({
                  url: img.startsWith('/uploads') ? `${API_URL}${img}` : `${API_URL}/uploads/${img}`,
                  path: img
                })));
        }
      } catch (err) {
        setError("Erreur lors du chargement du livre");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookData();
  }, [id]);

  useEffect(() => {
    return () => {
      images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [images]);

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
          setError(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
          return false;
        }
        return true;
      })
      .slice(0, MAX_FILES - (images.length + existingImages.length));

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

  const removeExistingImage = (index) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
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
    setSuccess(null);

    const requiredFields = ['title', 'author', 'category', 'condition', 'location', 'description', 'availability'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());

    if (missingFields.length > 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.trim());
      });

      // Envoyer toutes les images existantes
      existingImages.forEach((image) => {
        formDataToSend.append('existingImages', image.path);
      });

      // Ajouter les nouvelles images
      images.forEach(({ file }) => formDataToSend.append('images', file));

      await api.put(`/books/${id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      setSuccess('Livre mis à jour avec succès');
      setTimeout(() => navigate(`/books/${id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="add-book-container loading">
        <Loader className="spinner" size={48} />
        <p>Chargement du livre...</p>
      </div>
    );
  }

  return (
    <div className="add-book-container">
      <h2>Modifier le livre</h2>
      
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

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
              <p>(3 maximum au total)</p>
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

        {(existingImages.length > 0 || images.length > 0) && (
          <div className="preview-container">
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="preview-item">
                <img
                  src={image.url}
                  alt={`Preview ${index}`}
                  className="preview-image"
                  loading="lazy"
                />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeExistingImage(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {images.map((image, index) => (
              <div key={`new-${index}`} className="preview-item">
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

            {(existingImages.length + images.length) < 3 && (
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
              <option value="Echangé">Echangé</option>
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
          className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="button-spinner" size={18} />
              <span>Enregistrement en cours...</span>
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
      </form>
    </div>
  );
};

export default EditBook;