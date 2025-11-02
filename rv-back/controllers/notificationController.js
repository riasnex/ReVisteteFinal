import Notification from '../models/Notification.js';

// @desc    Obtener todas las notificaciones del usuario
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, unreadOnly = false } = req.query;

    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedUser', 'name email avatar')
      .populate('relatedGarment', 'title photos')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      notifications,
      unreadCount: await Notification.countDocuments({ user: userId, isRead: false })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener notificaciones'
    });
  }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al marcar notificación como leída'
    });
  }
};

// @desc    Marcar todas las notificaciones como leídas
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notificaciones marcadas como leídas`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al marcar todas las notificaciones como leídas'
    });
  }
};

// @desc    Eliminar notificación
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, user: userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar notificación'
    });
  }
};

// @desc    Obtener conteo de notificaciones no leídas
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener conteo de notificaciones'
    });
  }
};

// Función auxiliar para crear notificaciones (puede ser llamada desde otros controladores)
export const createNotification = async (userId, type, title, message, options = {}) => {
  try {
    // Validar que userId esté definido
    if (!userId) {
      console.error('Error: userId no definido al crear notificación');
      return null;
    }

    console.log('Intentando crear notificación:', {
      userId,
      type,
      title,
      messageLength: message?.length
    });

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedUser: options.relatedUser || null,
      relatedGarment: options.relatedGarment || null,
      relatedConversation: options.relatedConversation || null,
      metadata: options.metadata || {}
    });

    console.log('Notificación creada:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    console.error('Stack:', error.stack);
    return null;
  }
};

