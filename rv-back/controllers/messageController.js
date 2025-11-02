import { Message, Conversation } from '../models/Message.js';
import { validationResult } from 'express-validator';
import { createNotification } from './notificationController.js';

// @desc    Enviar mensaje
// @route   POST /api/messages o POST /api/messages/:conversationId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    let recipientId, conversationId;

    // Si viene conversationId en la URL, obtener el otro participante
    if (req.params.conversationId) {
      conversationId = req.params.conversationId;
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }

      if (!conversation.participants.map(p => p.toString()).includes(senderId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta conversación'
        });
      }

      recipientId = conversation.participants.find(
        p => p.toString() !== senderId.toString()
      );
      
      // Asegurar que recipientId sea un ObjectId
      if (!recipientId) {
        console.error('Error: No se pudo encontrar recipientId en la conversación');
      } else {
        console.log('RecipientId encontrado en conversación:', recipientId);
      }
    } else {
      // Si no viene conversationId, validar y usar recipientId del body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Error de validación'
        });
      }
      recipientId = req.body.recipientId;
    }

    const { message } = req.body;
    
    // Validar mensaje
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede estar vacío'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede exceder 1000 caracteres'
      });
    }

    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes enviarte un mensaje a ti mismo'
      });
    }

    // Buscar o crear conversación
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId]
      });
    }

    // Crear mensaje
    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      message
    });

    // Actualizar conversación con último mensaje
    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Poblar datos del remitente
    await newMessage.populate('sender', 'name email');

    // Crear notificación para el destinatario (solo si recipientId está definido y es diferente del sender)
    if (recipientId && recipientId.toString() !== senderId.toString()) {
      const senderName = newMessage.sender?.name || 'Alguien';
      
      console.log('=== CREANDO NOTIFICACIÓN ===');
      console.log('RecipientId:', recipientId);
      console.log('SenderId:', senderId);
      console.log('SenderName:', senderName);
      console.log('Message:', message.substring(0, 50));
      
      const notification = await createNotification(
        recipientId,
        'message',
        'Nuevo mensaje',
        `${senderName} te envió un mensaje: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        {
          relatedUser: senderId,
          relatedConversation: conversation._id
        }
      );
      
      if (notification) {
        console.log('Notificación creada exitosamente:', notification._id);
      } else {
        console.error('Error: No se pudo crear la notificación');
      }
    } else {
      console.log('No se crea notificación: recipientId no válido o mismo que senderId');
    }

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al enviar mensaje'
    });
  }
};

// @desc    Obtener conversaciones del usuario
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar todas las conversaciones donde el usuario participa
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email avatar')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    // Formatear respuesta
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      return {
        id: conv._id,
        participant: otherParticipant || conv.participants[0],
        lastMessage: conv.lastMessage?.message || '',
        lastMessageAt: conv.lastMessageAt,
        unread: 0 // Se puede calcular según mensajes no leídos
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener conversaciones'
    });
  }
};

// @desc    Obtener mensajes de una conversación
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verificar que el usuario participe en la conversación
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    // Obtener mensajes
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });

    // Marcar mensajes como leídos
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener mensajes'
    });
  }
};

