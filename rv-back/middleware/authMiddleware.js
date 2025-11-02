import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Proteger rutas - requiere autenticación
export const protect = async (req, res, next) => {
  let token;

  // Verificar si el token existe en los headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraer el token
      token = req.headers.authorization.split(' ')[1];

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener el usuario (sin la contraseña)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario desactivado'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token no válido o expirado'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, no hay token'
    });
  }
};

// Verificar si el usuario es el propietario del recurso
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para realizar esta acción`
      });
    }
    next();
  };
};

