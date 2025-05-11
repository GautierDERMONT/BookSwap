import React, { useState } from 'react'; 
import axios from 'axios';
import { Plus, X, Upload } from 'react-feather';
import { useNavigate } from 'react-router-dom'; // Importer useNavigate
import './AddBook.css'; // On réutilise le même CSS

const API_URL = 'http://localhost:5001';

const AddBook = () => {
  const navigate = useNavigate(); // Initialiser useNavigate
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
    description: ''
  });

  // Compteur de mots pour la description
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Gestion des images
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
      .filter(file => file.type.startsWith('image/'))
      .slice(0, 3 - images.length);

    if (files.length !== validFiles.length) {
      setError('Veuillez choisir uniquement des images.');
    } else {
      setError(null); // Réinitialiser l'erreur si tous les fichiers sont valides
    }

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

  // Validation des champs obligatoires
  const requiredFields = ['title', 'author', 'category', 'condition', 'location', 'description'];
  const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim().length === 0);

  if (missingFields.length > 0) {
    setError('Veuillez remplir tous les champs obligatoires');
    setIsSubmitting(false);
    return;
  }

  // Validation des images
  if (images.length === 0) {
    setError('Veuillez ajouter au moins une image');
    setIsSubmitting(false);
    return;
  }

  try {
    const formDataToSend = new FormData();
    
    // Ajouter les champs texte
    formDataToSend.append('title', formData.title.trim());
    formDataToSend.append('author', formData.author.trim());
    formDataToSend.append('category', formData.category.trim());
    formDataToSend.append('condition', formData.condition.trim());
    formDataToSend.append('location', formData.location.trim());
    formDataToSend.append('description', formData.description.trim());

    // Ajouter les images
    images.forEach((image) => {
      formDataToSend.append('images', image);
    });

    // Effectuer la requête POST
    const response = await axios.post(`${API_URL}/api/books`, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true
    });

    // Redirection après succès
    navigate('/', { state: { bookAdded: true } });
    alert("Livre ajouté avec succès !");
    
  } catch (err) {
    console.error('Erreur lors de l\'ajout du livre:', err);
    setError(err.response?.data?.error || 'Erreur lors de l\'ajout du livre');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="add-book-container">
      <h2>Ajouter un livre</h2>
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

        {images.length > 0 && (
          <div className="preview-container">
            {images.map((image, index) => (
              <div key={`new-${index}`} className="preview-item">
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

            {(images.length) < 3 && (
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
          <label>Auteur *</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
          />
          <small>{countWords(formData.description)} / 50 mots</small>
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement en cours...' : 'Ajouter le livre'}
        </button>
      </form>
    </div>
  );
};

export default AddBook;
