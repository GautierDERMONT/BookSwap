import React, { useState } from 'react';
import { Plus, X, Upload } from 'react-feather';
import { addBook } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './AddBook.css';

const AddBook = () => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    condition: '',
    location: '',
    description: ''
  });

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
    const validFiles = files
      .filter(file => file.type.startsWith('image/') && !images.some(img => img.name === file.name))
      .slice(0, 3 - images.length);

    if (validFiles.length) {
      setImages([...images, ...validFiles]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    // Vérification si tous les champs obligatoires sont remplis
    if (
      !formData.title ||
      !formData.category ||
      !formData.condition ||
      !formData.location ||
      !formData.description ||
      formData.description.trim().length === 0
    ) {
      setError('Veuillez remplir tous les champs obligatoires');
      setIsSubmitting(false);
      return;
    }
  
    // Vérification qu'il y a au moins une image
    if (images.length === 0) {
      setError('Veuillez ajouter au moins une image');
      setIsSubmitting(false);
      return;
    }
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('category', formData.category.trim());
      formDataToSend.append('condition', formData.condition.trim());
      formDataToSend.append('location', formData.location.trim());
      formDataToSend.append('description', formData.description.trim());
  
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });
  
      await addBook(formDataToSend);
      navigate('/', { state: { bookAdded: true } });
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du livre:', err);
      setError(err.message || 'Erreur lors de l\'ajout du livre');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  return (
    <div className="add-book-container">
      <h2>Ajouter un nouveau livre</h2>
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
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index}`}
                  className="preview-image"
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
            <label>Catégorie *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            maxLength="500"
          />
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Ajouter le livre'}
        </button>
      </form>
    </div>
  );
};

export default AddBook;