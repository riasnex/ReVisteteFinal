import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API_URL configurada:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo limpiar datos si no estamos en la página de inicio
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && !currentPath.includes('login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Solo redirigir si no estamos ya en home
        if (currentPath !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  register: async (userData) => {
    try {
      console.log('Enviando datos de registro:', userData);
      const response = await api.post('/auth/register', userData);
      console.log('Respuesta completa del registro:', response);
      return response.data;
    } catch (error) {
      console.error('Error en authService.register:', error);
      throw error;
    }
  },
  login: async (credentials) => {
    try {
      console.log('Enviando credenciales de login:', { ...credentials, password: '***' });
      const response = await api.post('/auth/login', credentials);
      console.log('Respuesta completa del login:', response);
      return response.data;
    } catch (error) {
      console.error('Error en authService.login:', error);
      throw error;
    }
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Servicios de prendas
export const garmentService = {
  getAll: async (filters = {}) => {
    const response = await api.get('/garments', { params: filters });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/garments/${id}`);
    return response.data;
  },
  create: async (garmentData) => {
    const formData = new FormData();
    
    // Agregar las fotos (archivos)
    if (garmentData.photos && Array.isArray(garmentData.photos)) {
      garmentData.photos.forEach((photo) => {
        // Si es un File object, agregarlo directamente
        if (photo instanceof File) {
          formData.append('photos', photo);
        }
      });
    }
    
    // Agregar el resto de los campos
    Object.keys(garmentData).forEach(key => {
      if (key !== 'photos') {
        // Si es un objeto (como location), convertirlo a JSON
        if (typeof garmentData[key] === 'object' && garmentData[key] !== null) {
          formData.append(key, JSON.stringify(garmentData[key]));
        } else {
          formData.append(key, garmentData[key]);
        }
      }
    });
    
    const response = await api.post('/garments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  update: async (id, garmentData) => {
    // Separar fotos existentes (URLs/strings) de nuevas (Files)
    const existingPhotos = garmentData.photos?.filter(p => typeof p === 'string') || [];
    const newPhotos = garmentData.photos?.filter(p => p instanceof File) || [];
    const hasNewFiles = newPhotos.length > 0;
    
    if (hasNewFiles) {
      // Si hay archivos nuevos, usar FormData
      const formData = new FormData();
      
      // Agregar nuevas fotos (Files)
      newPhotos.forEach(photo => {
        formData.append('photos', photo);
      });
      
      // Agregar fotos existentes como JSON string
      if (existingPhotos.length > 0) {
        formData.append('existingPhotos', JSON.stringify(existingPhotos));
      }
      
      // Agregar el resto de los campos
      Object.keys(garmentData).forEach(key => {
        if (key !== 'photos') {
          if (typeof garmentData[key] === 'object' && garmentData[key] !== null) {
            formData.append(key, JSON.stringify(garmentData[key]));
          } else {
            formData.append(key, garmentData[key]);
          }
        }
      });
      
      const response = await api.put(`/garments/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Si no hay archivos nuevos, enviar JSON normal
      // Incluir solo fotos existentes
      const updateData = {
        ...garmentData,
        existingPhotos: existingPhotos, // Enviar como existingPhotos para que el backend sepa que son existentes
      };
      const response = await api.put(`/garments/${id}`, updateData);
      return response.data;
    }
  },
  delete: async (id) => {
    const response = await api.delete(`/garments/${id}`);
    return response.data;
  },
  getByUser: async (userId) => {
    const response = await api.get(`/garments/user/${userId}`);
    return response.data;
  },
};

// Servicios de mensajes
export const messageService = {
  // Obtener todas las conversaciones del usuario
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data.conversations || response.data || [];
  },
  // Obtener mensajes de una conversación específica
  getMessages: async (conversationId) => {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data.messages || response.data || [];
  },
  // Enviar mensaje a una conversación existente
  sendMessageToConversation: async (conversationId, message) => {
    const response = await api.post(`/messages/${conversationId}`, { message });
    return response.data;
  },
  // Iniciar nueva conversación enviando un mensaje inicial
  startConversation: async (recipientId, message) => {
    const response = await api.post('/messages', { recipientId, message });
    return response.data;
  },
  // Método genérico para enviar mensaje (detecta si es nueva conversación o existente)
  sendMessage: async (conversationId, message, recipientId = null) => {
    if (conversationId) {
      // Conversación existente
      return await messageService.sendMessageToConversation(conversationId, message);
    } else if (recipientId) {
      // Nueva conversación
      return await messageService.startConversation(recipientId, message);
    } else {
      throw new Error('Se requiere conversationId o recipientId');
    }
  },
};

// Servicios de notificaciones
export const notificationService = {
  // Obtener todas las notificaciones del usuario
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
    
    const response = await api.get(`/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    return response.data;
  },
  // Obtener conteo de notificaciones no leídas
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.unreadCount || 0;
  },
  // Marcar notificación como leída
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  // Marcar todas las notificaciones como leídas
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  // Eliminar notificación
  delete: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default api;

