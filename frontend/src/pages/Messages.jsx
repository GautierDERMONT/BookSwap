import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../services/api';
import './Messages.css';
import { FiMessageSquare, FiChevronRight, FiClock, FiCheck, FiMapPin, FiImage } from 'react-icons/fi';

const Messages = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBook, setCurrentBook] = useState(null);
  const [interlocutor, setInterlocutor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [initialSelectionDone, setInitialSelectionDone] = useState(false);

  const getDefaultAvatar = (username) => {
    if (!username) return 'U';
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3'];
    const color = colors[firstLetter.charCodeAt(0) % colors.length];
    
    
    return (
      <div style={{
        backgroundColor: color,
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        {firstLetter}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const convResponse = await api.get('/conversations');
        const allConvs = convResponse.data.conversations || [];
        setConversations(allConvs);

        if (location.state?.bookId) {
          const { bookId, recipientId } = location.state;
          
          if (currentUser?.id === recipientId) {
            navigate(`/books/${bookId}/edit`, { replace: true });
            return;
          }

          const existingConv = allConvs.find(c => 
            c.book_id === bookId && 
            (c.interlocutor_id === recipientId || c.user1_id === recipientId || c.user2_id === recipientId)
          );

          if (existingConv) {
            setSelectedConversation(existingConv);
            await loadConversationDetails(existingConv.id, existingConv.book_id);
            navigate(`/messages/${existingConv.id}`, { replace: true });
          } else {
            const response = await api.post('/conversations', {
              bookId,
              recipientId
            });
            
            const newConv = {
              id: response.data.conversationId,
              book_id: bookId,
              interlocutor_id: recipientId,
              interlocutor_name: location.state?.interlocutor?.username,
              interlocutor_avatar: location.state?.interlocutor?.avatar,
              ...location.state?.bookInfo
            };
            
            setSelectedConversation(newConv);
            setConversations([newConv, ...allConvs]);
            await loadConversationDetails(response.data.conversationId, bookId);
            navigate(`/messages/${response.data.conversationId}`, { replace: true });
          }
        }
        else if (id) {
          const conv = allConvs.find(c => c.id === parseInt(id));
          if (conv) {
            setSelectedConversation(conv);
            await loadConversationDetails(conv.id, conv.book_id);
          } else {
            navigate('/messages');
          }
        }
        else if (allConvs.length > 0 && !initialSelectionDone) {
          const unreadConvs = allConvs.filter(c => c.unread_count > 0);
          let convToSelect = null;

          if (unreadConvs.length > 0) {
            convToSelect = unreadConvs.reduce((prev, current) => 
              new Date(prev.last_message_date) > new Date(current.last_message_date) ? prev : current
            );
          } else {
            convToSelect = allConvs.reduce((prev, current) => 
              new Date(prev.last_message_date) > new Date(current.last_message_date) ? prev : current
            );
          }

          if (!selectedConversation && convToSelect) {
            setSelectedConversation(convToSelect);
            await loadConversationDetails(convToSelect.id, convToSelect.book_id);
            navigate(`/messages/${convToSelect.id}`, { replace: true });
          }
          
          setInitialSelectionDone(true);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state, id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (selectedConversation) {
        try {
          const messagesRes = await api.get(`/conversations/${selectedConversation.id}/messages`);
          setMessages(messagesRes.data.messages || []);
        } catch (error) {
          console.error('Error refreshing messages:', error);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      api.post(`/conversations/${selectedConversation.id}/mark-as-read`);
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedConversation.id) {
          return { ...conv, unread_count: 0 };
        }
        return conv;
      }));
    }
  }, [selectedConversation]);

  const loadConversationDetails = async (convId, bookId) => {
    try {
      const [messagesRes, bookRes] = await Promise.all([
        api.get(`/conversations/${convId}/messages`),
        bookId ? api.get(`/books/${bookId}`) : Promise.resolve({ data: {} })
      ]);

      setMessages(messagesRes.data.messages || []);
      
      if (bookRes.data.book) {
        setCurrentBook({
          ...bookRes.data.book,
          location: bookRes.data.book.location || "Non spécifiée"
        });
      }

      if (selectedConversation?.id === convId) {
        const conv = conversations.find(c => c.id === convId);
        if (conv) {
          setInterlocutor({
            id: conv.interlocutor_id,
            username: conv.interlocutor_name,
            avatar: conv.interlocutor_avatar
          });
        }
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }, 100);
  };

  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
      try {
        await api.delete(`/conversations/${conversationId}`);
        
        const updatedConversations = conversations.filter(c => c.id !== conversationId);
        setConversations(updatedConversations);
        
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
          setCurrentBook(null);
          navigate('/messages');
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await api.post(`/conversations/${selectedConversation.id}/messages`, {
        content: newMessage,
      });

      const messagesRes = await api.get(`/conversations/${selectedConversation.id}/messages`);
      setMessages(messagesRes.data.messages || []);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérification du type de fichier
    if (!file.type.match('image.*')) {
      alert('Seules les images sont autorisées');
      return;
    }

    // Vérification de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('La taille maximale autorisée est de 5MB');
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendImage = async () => {
    if (!selectedImage || !selectedConversation) return;

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('conversationId', selectedConversation.id);

      const response = await api.post(`/conversations/${selectedConversation.id}/messages/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const messagesRes = await api.get(`/conversations/${selectedConversation.id}/messages`);
      setMessages(messagesRes.data.messages || []);
      setSelectedImage(null);
      setImagePreview(null);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending image:', error);
      alert("Erreur lors de l'envoi de l'image");
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProfileClick = (userId) => {
    navigate(userId === currentUser.id ? '/profile' : `/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="message-loading">
        <div className="message-spinner"></div>
      </div>
    );
  }

  return (
    <div className="message-container">
      <div className="message-conversation-list">
        <div className="message-list-header">
          <h2>Messages</h2>
        </div>
        
        {conversations.length > 0 ? (
          <div className="message-conversations">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`message-conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                onClick={async () => {
                  if (selectedConversation?.id !== conv.id) {
                    setSelectedConversation(conv);
                    navigate(`/messages/${conv.id}`);
                    await loadConversationDetails(conv.id, conv.book_id);
                  }
                }}
              >
                {conv.interlocutor_avatar ? (
                  <img 
                    src={conv.interlocutor_avatar}
                    alt={`Avatar de ${conv.interlocutor_name}`}
                    className="message-conv-avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick(conv.interlocutor_id);
                    }}
                  />
                ) : (
                  getDefaultAvatar(conv.interlocutor_name)
                )}
                <div className="message-conv-info">
                  <div className="message-conv-header">
                    <h4 className="message-conv-name">
                      {conv.interlocutor_name}
                    </h4>
                    <span className="message-conv-date">{formatDate(conv.last_message_date)}</span>
                  </div>
                  <p className="message-conv-preview">
                    {conv.last_message?.substring(0, 40) || 'Nouvelle conversation'}
                    {conv.unread_count > 0 && (
                      <span className="unread-badge">{conv.unread_count}</span>
                    )}
                  </p>
                </div>
                <button 
                  className="delete-conversation-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  aria-label="Supprimer la conversation"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="message-empty-conversations">
            <FiMessageSquare size={48} />
            <p>Aucune conversation</p>
          </div>
        )}
      </div>

      <div className="message-content-area">
        {selectedConversation ? (
          <>
            <div className="message-messages">
              <div style={{ flex: 1, minHeight: 0 }} />
                {messages.map((msg, index) => {
                  const showAvatar = msg.sender_id !== currentUser.id && 
                                    (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                  
                  return (
                    <div key={msg.id} className={`message-wrapper ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}>
                      {showAvatar && (
                        <div    className="message-avatar-container"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProfileClick(msg.sender_id);
                          }}>
                          {msg.sender_avatar ? (
                            <img 
                              src={`http://localhost:5001${msg.sender_avatar}`}
                              alt={`Avatar de ${msg.sender_name}`}
                              className="message-sender-avatar"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProfileClick(msg.sender_id);
                              }}
                            />
                          ) : (
                            getDefaultAvatar(msg.sender_name)
                          )}
                        </div>
                      )}
                      <div className={`message-bubble ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}>
                        <div className="message-content">
                          {msg.image_url ? (
                            <img 
                              src={`http://localhost:5001${msg.image_url}`} 
                              alt="Image envoyée" 
                              className="message-image"
                              onClick={() => window.open(`http://localhost:5001${msg.image_url}`, '_blank')}
                            />
                          ) : (
                            <p>{msg.content}</p>
                          )}
                          <div className="message-meta">
                            <span>{formatDate(msg.created_at)}</span>
                            {msg.sender_id === currentUser.id && (
                              <span>{msg.is_read ? <FiCheck /> : <FiClock />}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="message-input-container">
              <label htmlFor="image-upload" className="image-upload-label">
                <FiImage size={20} />
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Écrivez votre message..."
              />
              <button onClick={handleSendMessage}>Envoyer</button>
            </div>

            {imagePreview && (
              <div className="image-preview-container">
                <div className="image-preview-wrapper">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <button className="cancel-image-btn" onClick={handleCancelImage}>
                    &times;
                  </button>
                </div>
                <button 
                  className="send-image-btn"
                  onClick={handleSendImage}
                >
                  Envoyer l'image
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="message-empty-state">
            <FiMessageSquare size={64} />
            <h3>Sélectionnez une conversation</h3>
          </div>
        )}
      </div>

      {selectedConversation && currentBook && (
        <div className="message-book-summary">
          <div className="message-book-header">
            <h3>Détails du livre</h3>
          </div>
          
          <div className="message-book-image">
            <img
              src={currentBook.images?.[0] 
                ? `http://localhost:5001${currentBook.images[0]}`
                : '/placeholder.jpg'
              }
              alt={currentBook.title}
            />
          </div>
          
          <div className="message-book-details">
            <h4>{currentBook.title}</h4>
           
            <p className="message-book-author">{currentBook.author || 'Auteur inconnu'}</p>
            
            <p className="message-book-category">Catégorie: {currentBook.category || 'Non spécifiée'}</p>

            <p className="message-book-date">
              Publié le: {formatDate(currentBook.created_at)}
            </p>
            
            <div className="message-book-meta">
              <span className="message-book-condition">État: {currentBook.condition}</span>
              <span className="message-book-location">
                <FiMapPin /> {currentBook.location || 'Non spécifiée'}
              </span>

              <span className={`message-book-availability availability-${currentBook.availability?.toLowerCase()}`}>
                {currentBook.availability || 'Non Spécifié'}
              </span>
            </div>
            
            <div className="message-book-description">
              <p>{currentBook.description || 'Aucune description disponible.'}</p>
            </div>
            
              <div className="message-book-publisher">
                <h4>Publié par :</h4>
                <div 
                  className="publisher-content"
                  onClick={() => handleProfileClick(currentBook?.user?.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {currentBook?.avatar ? (
                    <img 
                      src={`http://localhost:5001${currentBook.avatar}`}
                      alt={`Avatar de ${currentBook?.user?.username || 'utilisateur'}`}
                      className="message-book-publisher-avatar"
                    />
                  ) : (
                    getDefaultAvatar(currentBook?.user?.username)
                  )}
                  <p className="publisher-name">
                    {selectedConversation?.publisher_name || currentBook?.user?.username || 'Non spécifié'}
                  </p>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;