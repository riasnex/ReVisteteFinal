import Post from '../models/Post.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// @desc    Crear nueva publicación
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Error de validación'
      });
    }

    const { title, description, category, size, gender, state } = req.body;

    // Obtener URLs de las imágenes subidas
    let photos = [];
    if (req.files && req.files.length > 0) {
      // Construir URLs completas de las imágenes
      photos = req.files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      });
    } else if (req.body.photos) {
      // Si se envía como string (URLs externas o base64)
      photos = Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos];
    }

    // Verificar que haya al menos una foto
    if (!photos || photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir al menos una foto'
      });
    }

    // Preparar datos de ubicación
    let locationData = null;
    let location = req.body.location;
    
    console.log('=== DEBUG UBICACIÓN EN BACKEND ===');
    console.log('Location recibida (raw):', location);
    console.log('Tipo de location:', typeof location);
    
    // Si location viene como string JSON (desde FormData), parsearlo
    if (location && typeof location === 'string') {
      try {
        location = JSON.parse(location);
        console.log('Location parseada:', location);
      } catch (e) {
        console.error('Error al parsear location:', e);
        location = null;
      }
    }
    
    if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      const [lng, lat] = location.coordinates;
      
      // Validar que las coordenadas sean números válidos
      if (typeof lng === 'number' && typeof lat === 'number' && 
          !isNaN(lng) && !isNaN(lat) &&
          (lng !== 0 || lat !== 0)) {
        locationData = {
          type: 'Point',
          coordinates: [lng, lat], // [longitude, latitude] para MongoDB GeoJSON
          city: location.city || null,
          country: location.country || null,
          address: location.address || null
        };
        console.log('Ubicación guardada:', locationData);
      } else {
        console.log('Coordenadas inválidas o (0,0), no se guarda ubicación');
      }
    } else {
      console.log('No hay ubicación o coordenadas inválidas');
    }

    const post = await Post.create({
      title,
      description,
      category,
      size,
      gender,
      state: state || 'used',
      photos: photos, // Ya es un array
      location: locationData,
      user: req.user._id
    });

    // Poblar datos del usuario
    await post.populate('user', 'name email');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear publicación'
    });
  }
};

// @desc    Listar todas las publicaciones
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const {
      category,
      size,
      gender,
      state,
      search,
      featured,
      limit = 20,
      page = 1
    } = req.query;

    // Construir filtros
    const filters = { isAvailable: true };

    if (category) filters.category = category;
    if (size) filters.size = size;
    if (gender) filters.gender = gender;
    if (state) filters.state = state;
    if (featured === 'true') filters.isFeatured = true;

    // Búsqueda por texto
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(filters)
      .populate('user', 'name email location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments(filters);

    res.json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener publicaciones'
    });
  }
};

// @desc    Obtener publicación por ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name email phone address location');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Incrementar vistas
    post.views += 1;
    await post.save();

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener publicación'
    });
  }
};

// @desc    Listar publicaciones de un usuario
// @route   GET /api/posts/user/:id
// @access  Public
export const getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.params.id,
      isAvailable: true
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener publicaciones del usuario'
    });
  }
};

// @desc    Actualizar publicación
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar que el usuario sea el propietario
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta publicación'
      });
    }

    // Parsear location si viene como string JSON
    let locationData = null;
    if (req.body.location) {
      try {
        locationData = typeof req.body.location === 'string' 
          ? JSON.parse(req.body.location) 
          : req.body.location;
      } catch (e) {
        locationData = req.body.location;
      }
    }

    const { title, description, category, size, gender, state, isAvailable } = req.body;

    // Actualizar campos de texto
    if (title !== undefined) post.title = title;
    if (description !== undefined) post.description = description;
    if (category !== undefined) post.category = category;
    if (size !== undefined) post.size = size;
    if (gender !== undefined) post.gender = gender;
    if (state !== undefined) post.state = state;
    if (isAvailable !== undefined) post.isAvailable = isAvailable;

    // Manejar fotos: combinar existentes con nuevas
    let photos = [];
    
    // Si hay archivos nuevos subidos, procesarlos
    if (req.files && req.files.length > 0) {
      const newPhotoUrls = req.files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      });
      
      // Obtener fotos existentes del body
      let existingPhotos = [];
      
      // Intentar obtener existingPhotos del body (puede venir como array o string)
      if (req.body.existingPhotos) {
        if (Array.isArray(req.body.existingPhotos)) {
          existingPhotos = req.body.existingPhotos;
        } else if (typeof req.body.existingPhotos === 'string') {
          try {
            const parsed = JSON.parse(req.body.existingPhotos);
            if (Array.isArray(parsed)) {
              existingPhotos = parsed;
            }
          } catch (e) {
            // Si no se puede parsear, intentar extraer del formato FormData
            if (req.body.existingPhotos && typeof req.body.existingPhotos === 'object') {
              existingPhotos = Object.values(req.body.existingPhotos).filter(url => typeof url === 'string');
            }
          }
        }
      }
      
      // Combinar existentes con nuevas
      photos = [...existingPhotos, ...newPhotoUrls];
    } else {
      // Si no hay archivos nuevos, usar las fotos del body o mantener las actuales
      if (req.body.existingPhotos) {
        if (Array.isArray(req.body.existingPhotos)) {
          photos = req.body.existingPhotos;
        } else if (typeof req.body.existingPhotos === 'string') {
          try {
            const parsed = JSON.parse(req.body.existingPhotos);
            photos = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            photos = post.photos || [];
          }
        } else if (typeof req.body.existingPhotos === 'object') {
          photos = Object.values(req.body.existingPhotos).filter(url => typeof url === 'string');
        }
      } else if (req.body.photos) {
        // Si viene photos directamente (cuando no hay archivos)
        photos = Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos];
      } else {
        // Mantener fotos actuales
        photos = post.photos || [];
      }
    }

    post.photos = photos;

    // Actualizar ubicación
    if (locationData) {
      if (locationData.coordinates && Array.isArray(locationData.coordinates)) {
        post.location = {
          type: 'Point',
          coordinates: [locationData.coordinates[0], locationData.coordinates[1]],
          city: locationData.city || post.location?.city,
          country: locationData.country || 'España',
          address: locationData.address || post.location?.address
        };
      } else if (locationData === null) {
        // Eliminar ubicación si se envía null
        post.location = undefined;
      }
    }

    await post.save();

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar publicación'
    });
  }
};

// @desc    Eliminar publicación
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar que el usuario sea el propietario
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta publicación'
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Publicación eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar publicación'
    });
  }
};

