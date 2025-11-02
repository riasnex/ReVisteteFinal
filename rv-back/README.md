# ReVístete Backend

Backend del proyecto ReVístete - API REST para plataforma de reciclaje y reutilización de ropa.

## 🚀 Tecnologías

- **Node.js** con **Express**
- **MongoDB** con **Mongoose**
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Multer** para subida de archivos (opcional)
- **express-validator** para validación
- **CORS** habilitado

## 📦 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Edita `.env` y configura:
- `PORT`: Puerto del servidor (por defecto: 5000)
- `MONGODB_URI`: URI de conexión a MongoDB Atlas
- `JWT_SECRET`: Secret para firmar tokens JWT
- `JWT_EXPIRE`: Tiempo de expiración del token (ej: 7d)
- `CORS_ORIGIN`: Origen permitido para CORS (ej: http://localhost:3000)

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Ejecutar en producción:
```bash
npm start
```

## 📁 Estructura del Proyecto

```
rv-back/
├── config/
│   └── db.js              # Configuración de MongoDB
├── controllers/
│   ├── authController.js   # Autenticación
│   ├── userController.js   # Gestión de usuarios
│   ├── postController.js  # Gestión de publicaciones
│   └── messageController.js # Mensajería
├── middleware/
│   ├── authMiddleware.js  # Protección de rutas
│   └── errorMiddleware.js # Manejo de errores
├── models/
│   ├── User.js            # Modelo de usuario
│   ├── Post.js            # Modelo de publicación
│   └── Message.js         # Modelo de mensajes
├── routes/
│   ├── authRoutes.js      # Rutas de autenticación
│   ├── userRoutes.js      # Rutas de usuarios
│   ├── postRoutes.js      # Rutas de publicaciones
│   └── messageRoutes.js   # Rutas de mensajes
├── server.js              # Servidor principal
└── package.json
```

## 🎯 Endpoints

### Autenticación (`/api/auth`)

- `POST /register` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión
- `GET /me` o `GET /profile` - Obtener perfil autenticado

### Usuarios (`/api/users`)

- `GET /:id` - Obtener perfil público de un usuario
- `PUT /update` - Actualizar perfil (requiere autenticación)

### Publicaciones (`/api/posts` o `/api/garments`)

- `GET /` - Listar todas las publicaciones (con filtros)
- `GET /:id` - Obtener publicación por ID
- `GET /user/:id` - Listar publicaciones de un usuario
- `POST /` - Crear nueva publicación (requiere autenticación)
- `PUT /:id` - Actualizar publicación (requiere autenticación)
- `DELETE /:id` - Eliminar publicación (requiere autenticación)

### Mensajes (`/api/messages`)

- `POST /` - Enviar mensaje (requiere autenticación)
- `POST /:conversationId` - Enviar mensaje a conversación específica
- `GET /conversations` - Obtener conversaciones del usuario (requiere autenticación)
- `GET /:conversationId` - Obtener mensajes de una conversación (requiere autenticación)

## 🔒 Autenticación

Las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

El token se obtiene al registrarse o iniciar sesión.

## 📝 Formatos de Respuesta

### Éxito:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error:
```json
{
  "success": false,
  "message": "Mensaje de error"
}
```

## 🔧 Validación

Los endpoints incluyen validación usando `express-validator`. Los errores de validación se devuelven en formato:
```json
{
  "success": false,
  "errors": [
    {
      "msg": "El email es obligatorio",
      "param": "email"
    }
  ]
}
```

## 🌍 MongoDB Atlas

Para usar MongoDB Atlas:
1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Obtén la URI de conexión
4. Agrega tu IP a la lista blanca
5. Configura `MONGODB_URI` en el archivo `.env`

## 📌 Notas

- El backend está configurado para trabajar con el frontend en `http://localhost:3000`
- Los endpoints de publicaciones también están disponibles en `/api/garments` para compatibilidad con el frontend
- Las imágenes se pueden subir directamente como URLs en el campo `photos` (se puede integrar Cloudinary más adelante)

