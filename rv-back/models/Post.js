import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: ['camisetas', 'pantalones', 'vestidos', 'abrigos', 'zapatos', 'accesorios']
  },
  size: {
    type: String,
    required: [true, 'La talla es obligatoria'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  gender: {
    type: String,
    required: [true, 'El género es obligatorio'],
    enum: ['hombre', 'mujer', 'unisex', 'niño', 'niña']
  },
  state: {
    type: String,
    required: [true, 'El estado es obligatorio'],
    enum: ['new', 'used'],
    default: 'used'
  },
  photos: [{
    type: String, // URLs de las imágenes
    required: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // [longitude, latitude]
    },
    city: String,
    country: String,
    address: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índice para búsqueda geográfica
postSchema.index({ location: '2dsphere' });
postSchema.index({ user: 1 });
postSchema.index({ category: 1 });
postSchema.index({ isAvailable: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;

