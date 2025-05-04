import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const Messages = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/conversations');
        setConversations(response.data);
        
        // Si nouvelle conversation depuis BookDetails
        if (location.state?.newConversation) {
          const existing = response.data.find(conv => 
            conv.book_id === location.state.newConversation.bookId &&
            (conv.user1_id === location.state.newConversation.recipientId || 
             conv.user2_id === location.state.newConversation.recipientId)
          );
          
          if (existing) {
            setSelectedConversation(existing.id);
          } else {
            const newConv = await api.post('/conversations', {
              bookId: location.state.newConversation.bookId,
              recipientId: location.state.newConversation.recipientId
            });
            setConversations([...response.data, {
              id: newConv.data.conversationId,
              book_id: location.state.newConversation.bookId,
              username: location.state.newConversation.recipientName,
              book_title: location.state.newConversation.bookTitle,
              last_message: "Nouvelle conversation"
            }]);
            setSelectedConversation(newConv.data.conversationId);
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [location.state]);

  useEffect(() => {
    if (selectedConversation) {
      api.get(`/conversations/${selectedConversation}/messages`)
        .then(res => setMessages(res.data))
        .catch(err => console.error(err));
    }
  }, [selectedConversation]);

  if (loading) return <div>Chargement des conversations...</div>;

  return (
    <div className="messaging-container">
      <div className="conversation-list">
        <h3>Conversations</h3>
        {conversations.length > 0 ? (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''}`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <div className="conv-avatar">
                <img src={conv.avatar || '/default-avatar.jpg'} alt={conv.username} />
              </div>
              <div className="conv-info">
                <h4>{conv.username}</h4>
                <p>{conv.book_title}</p>
                <p className="last-message">
                  {conv.last_message?.substring(0, 30) || 'Nouvelle conversation'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>Aucune conversation disponible</p>
        )}
      </div>

      <div className="message-area">
        {selectedConversation ? (
          <>
            <div className="messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                >
                  <p>{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
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
          <div className="no-conversation-selected">
            <p>Sélectionnez une conversation pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;