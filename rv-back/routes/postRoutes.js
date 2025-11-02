import express from 'express';
import { body } from 'express-validator';
import {
  createPost,
  getPosts,
  getPostById,
  getPostsByUser,
  updatePost,
  deletePost
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Validadores
const createPostValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El título no puede exceder 100 caracteres'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria')
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('category')
    .isIn(['camisetas', 'pantalones', 'vestidos', 'abrigos', 'zapatos', 'accesorios'])
    .withMessage('Categoría inválida'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Talla inválida'),
  body('gender')
    .isIn(['hombre', 'mujer', 'unisex', 'niño', 'niña'])
    .withMessage('Género inválido'),
  body('state')
    .optional()
    .isIn(['new', 'used'])
    .withMessage('Estado inválido')
];

router.get('/', getPosts);
router.get('/:id', getPostById);
router.get('/user/:id', getPostsByUser);
router.post('/', protect, upload.array('photos', 10), createPostValidator, createPost); // Permite hasta 10 fotos
router.put('/:id', protect, upload.array('photos', 10), updatePost); // Permite subir nuevas fotos al editar
router.delete('/:id', protect, deletePost);

export default router;

