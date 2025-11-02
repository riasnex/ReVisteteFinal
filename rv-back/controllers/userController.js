import User from '../models/User.js';
import Post from '../models/Post.js';
import { validationResult } from 'express-validator';

// @desc    Obtener perfil público de un usuario
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener publicaciones del usuario
    const posts = await Post.find({ user: user._id, isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        location: user.location,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      postsCount: posts.length,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener perfil del usuario'
    });
  }
};

// @desc    Actualizar perfil del usuario
// @route   PUT /api/users/update
// @access  Private
export const updateProfile = async (req, res) => {
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

    const { name, phone, address, location } = req.body;

    // Construir objeto de actualización
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: [location.longitude || 0, location.latitude || 0],
        city: location.city,
        country: location.country || 'España'
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        location: user.location,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar perfil'
    });
  }
};

