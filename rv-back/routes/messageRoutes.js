import express from 'express';
import { body } from 'express-validator';
import {
  sendMessage,
  getConversations,
  getMessages
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validadores
const sendMessageValidator = [
  body('recipientId')
    .notEmpty()
    .withMessage('El ID del destinatario es obligatorio')
    .isMongoId()
    .withMessage('ID de destinatario inválido'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('El mensaje no puede estar vacío')
    .isLength({ max: 1000 })
    .withMessage('El mensaje no puede exceder 1000 caracteres')
];

router.post('/', protect, sendMessageValidator, sendMessage);
router.post('/:conversationId', protect, sendMessage); // Para enviar mensajes a una conversación específica (sin validación de recipientId)
router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);

export default router;

