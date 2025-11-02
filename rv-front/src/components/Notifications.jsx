import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';

const Notifications = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  // Cargar notificaciones
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const data = await notificationService.getAll({ limit: 20 });
      const notificationsList = data.notifications || data || [];
      console.log('Notificaciones cargadas:', notificationsList);
      setNotifications(Array.isArray(notificationsList) ? notificationsList : []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar conteo de no leídas (más rápido que cargar todas)
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error al cargar conteo de notificaciones:', error);
    }
  };

  // Cargar notificaciones cuando se abre el dropdown
  const handleDropdownToggle = () => {
    const newState = !showDropdown;
    setShowDropdown(newState);
    
    if (newState) {
      loadNotifications();
    }
  };

  // Cargar conteo inicial y configurar polling
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      loadNotifications();
      
      // Actualizar conteo cada 10 segundos (más frecuente para debugging)
      intervalRef.current = setInterval(() => {
        loadUnreadCount();
        // Recargar notificaciones si el dropdown está abierto
        if (showDropdown) {
          loadNotifications();
        }
      }, 10000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, showDropdown]);

  if (!isAuthenticated) return null;

  const handleNotificationClick = async (notification) => {
    // Marcar como leída si no está leída
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id || notification.id);
        setNotifications(prev =>
          prev.map(n =>
            (n._id || n.id) === (notification._id || notification.id) 
              ? { ...n, isRead: true } 
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
      }
    }

    // Navegar según el tipo de notificación
    if (notification.type === 'message' && notification.relatedConversation) {
      navigate('/messages');
    } else if (notification.relatedGarment) {
      const garmentId = notification.relatedGarment._id || notification.relatedGarment;
      navigate(`/garment/${garmentId}`);
    }

    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.delete(notificationId);
      const notification = notifications.find(n => (n._id || n.id) === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => (n._id || n.id) !== notificationId));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'new_follower':
        return '👤';
      case 'garment_interest':
        return '👕';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace unos segundos';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleDropdownToggle}
        className="relative flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notificaciones</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Leer todas</span>
                  </button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => {
                  const notificationId = notification._id || notification.id;
                  const isUnread = !notification.isRead;
                  
                  return (
                    <div
                      key={notificationId}
                      className={`relative group p-4 hover:bg-gray-50 transition-colors ${
                        isUnread ? 'bg-primary-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          {isUnread && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleDeleteNotification(e, notificationId)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                        title="Eliminar notificación"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;

