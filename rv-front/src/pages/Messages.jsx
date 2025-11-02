import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import HeaderHome from '../components/HeaderHome';
import { messageService } from '../services/api';
import { Send, User } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const conversations = await messageService.getConversations();
      // Asegurar que conversations sea un array
      const conversationsArray = Array.isArray(conversations) ? conversations : [];
      setConversations(conversationsArray);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      // Usar _id si existe, sino id
      const conversationId = selectedConversation._id || selectedConversation.id;
      const messages = await messageService.getMessages(conversationId);
      // Asegurar que messages sea un array
      const messagesArray = Array.isArray(messages) ? messages : [];
      setMessages(messagesArray);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Limpiar input inmediatamente para mejor UX

    try {
      // Usar _id si existe, sino id
      const conversationId = selectedConversation._id || selectedConversation.id;
      const response = await messageService.sendMessage(conversationId, messageText);
      
      // Si se envió correctamente, recargar mensajes para obtener el formato completo del backend
      await loadMessages();
      
      // También recargar conversaciones para actualizar el último mensaje
      await loadConversations();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Restaurar el mensaje si falló
      setNewMessage(messageText);
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Mensajes</h1>

          <div className="card p-0 overflow-hidden">
            <div className="flex h-[600px]">
              {/* Lista de conversaciones */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-600">
                    Cargando conversaciones...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-600">
                    No tienes conversaciones
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const conversationId = conversation._id || conversation.id;
                    const selectedId = selectedConversation?._id || selectedConversation?.id;
                    const isSelected = selectedId === conversationId;
                    
                    return (
                      <button
                        key={conversationId}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          isSelected
                            ? 'bg-primary-50 border-l-4 border-l-primary-600'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary-600 w-10 h-10 rounded-full flex items-center justify-center text-white">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-800 truncate">
                                {conversation.participant?.name || conversation.participant?.email || 'Usuario'}
                              </p>
                              {conversation.unread > 0 && (
                                <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                                  {conversation.unread}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage || 'Sin mensajes'}
                            </p>
                            {conversation.lastMessageAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(conversation.lastMessageAt).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Área de mensajes */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Header de la conversación */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <h2 className="font-semibold text-gray-800">
                        {selectedConversation.participant?.name || selectedConversation.participant?.email || 'Usuario'}
                      </h2>
                      {selectedConversation.participant?.email && (
                        <p className="text-sm text-gray-600">{selectedConversation.participant.email}</p>
                      )}
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                          No hay mensajes aún. ¡Envía el primer mensaje!
                        </div>
                      ) : (
                        messages.map((message) => {
                          // Manejar diferentes formatos de sender (puede ser objeto con _id o string)
                          const senderId = message.sender?._id || message.sender || message.senderId;
                          const currentUserId = user._id || user.id;
                          const isOwn = senderId?.toString() === currentUserId?.toString();
                          
                          return (
                            <div
                              key={message._id || message.id}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isOwn
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{message.message}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn ? 'text-primary-100' : 'text-gray-500'
                                  }`}
                                >
                                  {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input de mensaje */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              sendMessage();
                            }
                          }}
                          placeholder="Escribe un mensaje..."
                          className="input-field flex-1"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Selecciona una conversación para empezar
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;

