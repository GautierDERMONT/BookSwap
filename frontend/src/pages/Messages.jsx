import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../services/api';
import './Messages.css';
import { FiMessageSquare, FiChevronRight, FiClock, FiCheck, FiMapPin } from 'react-icons/fi';

const Messages = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBook, setCurrentBook] = useState(null);
  const [interlocutor, setInterlocutor] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const convResponse = await api.get('/conversations');
        const allConvs = convResponse.data.conversations || [];
        setConversations(allConvs);

        if (id) {
          const conv = allConvs.find(c => c.id === parseInt(id));
          if (conv) {
            setSelectedConversation(conv);
            loadConversationDetails(conv.id, conv.book_id);
          }
        } else if (location.state?.newConversation) {
          await handleNewConversation(allConvs);
        } else if (allConvs.length > 0) {
          setSelectedConversation(allConvs[0]);
          loadConversationDetails(allConvs[0].id, allConvs[0].book_id);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state, id]);

// Dans Messages.jsx, modifier la fonction loadConversationDetails
const loadConversationDetails = async (convId, bookId) => {
  try {
    const [messagesRes, bookRes] = await Promise.all([
      api.get(`/conversations/${convId}/messages`),
      api.get(`/books/${bookId}`)
    ]);

    setMessages(messagesRes.data.messages || []);
    setCurrentBook({
      ...bookRes.data.book,
      location: bookRes.data.book.location || "Non spécifiée"
    });
    
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setInterlocutor({
        id: conv.interlocutor_id,
        username: conv.interlocutor_name,
        avatar: conv.interlocutor_avatar
      });
    }
    
    scrollToBottom();
    
    // Ajouter cette ligne pour rafraîchir le compteur de messages non lus
    await api.get('/unread'); // Cela va déclencher la mise à jour dans Header
  } catch (error) {
    console.error('Error loading details:', error);
  }
};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
      try {
        await api.delete(`/conversations/${conversationId}`);
        
        // Mettre à jour la liste des conversations
        const updatedConversations = conversations.filter(c => c.id !== conversationId);
        setConversations(updatedConversations);
        
        // Si on supprime la conversation active
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Liste des conversations */}
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
                onClick={(e) => {
                  // Empêcher la navigation si on clique sur la croix
                  if (e.target.closest('.delete-conversation-btn')) return;
                  setSelectedConversation(conv);
                  navigate(`/messages/${conv.id}`);
                  loadConversationDetails(conv.id, conv.book_id);
                }}
              >
                <div className="message-conv-info">
                  <div className="message-conv-header">
                    <h4 className="message-conv-name">{conv.interlocutor_name}</h4>
                    <span className="message-conv-date">{formatDate(conv.last_message_date)}</span>
                  </div>
                  <p className="message-conv-preview">
                    {conv.last_message?.substring(0, 40) || 'Nouvelle conversation'}
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

      {/* Zone de messagerie principale */}
      <div className="message-content-area">
        {selectedConversation ? (
          <>
            <div className="message-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-bubble ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                >
                  <p>{msg.content}</p>
                  <div className="message-meta">
                    <span>{formatDate(msg.created_at)}</span>
                    {msg.sender_id === currentUser.id && (
                      <span>{msg.is_read ? <FiCheck /> : <FiClock />}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Écrivez votre message..."
              />
              <button onClick={handleSendMessage}>Envoyer</button>
            </div>
          </>
        ) : (
          <div className="message-empty-state">
            <FiMessageSquare size={64} />
            <h3>Sélectionnez une conversation</h3>
          </div>
        )}
      </div>

      {/* Récapitulatif du livre */}
      {selectedConversation && currentBook && (
        <div className="message-book-summary">
          <div className="message-book-header">
            <h3>Détails du livre</h3>
          </div>
          
          <div className="message-book-image">
            <img
              src={currentBook.images?.[0] 
                ? `http://localhost:5001/uploads/${currentBook.images[0]}`
                : '/placeholder.jpg'
              }
              alt={currentBook.title}
            />
          </div>
          
          <div className="message-book-details">
            <h4>{currentBook.title}</h4>
            <p className="message-book-author">{currentBook.author || 'Auteur inconnu'}</p>
            
            <div className="message-book-meta">
              <span className="message-book-condition">État: {currentBook.condition}</span>
              <span className="message-book-location">
                <FiMapPin /> {currentBook.location || 'Non spécifiée'}
              </span>
            </div>
            
            <div className="message-book-description">
              <p>{currentBook.description || 'Aucune description disponible.'}</p>
            </div>
            
            {/* Section éditeur */}
              {/* Section éditeur */}
              <div className="message-book-publisher">
                <h4>Publié par :</h4>
                <p>{selectedConversation?.publisher_name || currentBook?.user?.username || 'Non spécifié'}</p>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
