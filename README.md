# 📋 Resumen de Funcionamiento - ReVístete

## 🏗️ Arquitectura General

**ReVístete** es una aplicación web para intercambio y venta de ropa de segunda mano, construida con:
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Autenticación**: JWT (JSON Web Tokens)
- **Mapas**: Leaflet + OpenStreetMap
- **Almacenamiento**: Multer (archivos locales)

---

## 🔐 Sistema de Autenticación

### Backend (`rv-back/controllers/authController.js`)
1. **Registro de Usuario**:
   - Recibe: `name`, `email`, `password`, `phone`, `address`, `location`
   - Valida datos con `express-validator`
   - Hashea contraseña con `bcrypt` (10 rounds)
   - Crea usuario en MongoDB
   - Genera JWT token
   - Devuelve: `token`, `user` (sin password)

2. **Login**:
   - Recibe: `email`, `password`
   - Busca usuario por email
   - Compara contraseña hasheada con `bcrypt.compare()`
   - Genera JWT token válido por 30 días
   - Devuelve: `token`, `user`

3. **Middleware de Autenticación** (`rv-back/middleware/authMiddleware.js`):
   - Verifica JWT en header `Authorization: Bearer <token>`
   - Extrae `userId` del token
   - Agrega `req.user` a la petición
   - Bloquea rutas si el token es inválido

### Frontend (`rv-front/src/context/AuthContext.jsx`)
1. **AuthContext**:
   - Almacena estado de autenticación (`user`, `isAuthenticated`, `loading`)
   - Funciones: `login()`, `register()`, `logout()`, `initAuth()`
   - Guarda token en `localStorage`
   - Valida token al iniciar la app

2. **Protected Routes** (`rv-front/src/components/ProtectedRoute.jsx`):
   - Envuelve rutas que requieren autenticación
   - Redirige a `/` si el usuario no está autenticado

---

## 👤 Gestión de Usuarios

### Modelo (`rv-back/models/User.js`)
- Campos: `name`, `email`, `password` (hasheado), `phone`, `address`, `location` (GeoJSON), `avatar`, `createdAt`
- Pre-save hook: hashea password automáticamente antes de guardar

### Endpoints:
- `GET /api/users/profile` - Obtener perfil del usuario autenticado
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/:id` - Ver perfil público de otro usuario

---

## 👕 Sistema de Publicaciones (Prendas)

### Modelo (`rv-back/models/Post.js`)
- Campos:
  - Información: `title`, `description`, `category`, `size`, `gender`, `state` (new/used)
  - Multimedia: `photos` (array de URLs)
  - Ubicación: `location` (GeoJSON Point con coordinates, city, country, address)
  - Referencias: `user` (ObjectId), `views`, `available`

### Flujo de Publicación:

#### Frontend (`rv-front/src/pages/Publish.jsx`)
1. Usuario completa formulario:
   - Datos básicos (título, descripción, categoría, talla, género, estado)
   - Sube fotos (múltiples, max 10)
   - Selecciona ubicación en mapa (Leaflet)
   - Click en mapa → reverse geocoding (Nominatim) → obtiene city/country/address

2. `handleSubmit()`:
   - Crea `FormData` con todos los campos
   - Serializa `location` objeto a JSON string
   - Envía a `/api/garments` con `multipart/form-data`

#### Backend (`rv-back/controllers/postController.js`)
1. `createPost()`:
   - Middleware `upload.array('photos', 10)` guarda archivos en `/uploads`
   - Genera URLs: `/uploads/nombre-archivo.jpg`
   - Parsea `location` desde JSON string
   - Valida coordenadas (no puede ser [0,0])
   - Crea Post en MongoDB con:
     - `photos`: array de URLs
     - `location`: objeto GeoJSON con type: 'Point', coordinates: [lng, lat]
   - Devuelve post creado

#### Frontend - Visualización:
- `Home.jsx`: Muestra prendas destacadas (las más recientes)
- `Explore.jsx`: Lista todas las prendas con filtros + mapa
- `Detail.jsx`: Vista detallada con fotos, info, ubicación en mapa
- `Profile.jsx`: Muestra prendas del usuario autenticado

### Endpoints:
- `POST /api/garments` - Crear nueva prenda (requiere auth, multipart/form-data)
- `GET /api/garments` - Listar todas las prendas
- `GET /api/garments/:id` - Obtener prenda específica
- `PUT /api/garments/:id` - Actualizar prenda (solo el dueño)
- `DELETE /api/garments/:id` - Eliminar prenda (solo el dueño)
- `GET /api/garments/user/:userId` - Obtener prendas de un usuario

---

## 💬 Sistema de Mensajería

### Modelos (`rv-back/models/Message.js`)

1. **Conversation**:
   - `participants`: [ObjectId, ObjectId] (2 usuarios)
   - `lastMessage`: referencia al último mensaje
   - `lastMessageAt`: fecha del último mensaje

2. **Message**:
   - `conversation`: referencia a Conversation
   - `sender`: referencia a User
   - `message`: texto (max 1000 caracteres)
   - `isRead`: boolean
   - `readAt`: fecha de lectura

### Flujo de Mensajes:

#### Crear Conversación (`rv-back/controllers/messageController.js`)
1. Usuario envía mensaje inicial desde `Detail.jsx` (botón "Contactar"):
   - `POST /api/messages` con `{ recipientId, message }`
   - Backend busca o crea Conversation con ambos participantes
   - Crea Message
   - **Crea Notification** para el destinatario
   - Actualiza `lastMessage` y `lastMessageAt` de Conversation

2. Continuar Conversación Existente:
   - `POST /api/messages/:conversationId` con `{ message }`
   - Backend obtiene `recipientId` de la conversación
   - Crea nuevo Message
   - **Crea Notification** para el destinatario

#### Frontend (`rv-front/src/pages/Messages.jsx`)
1. `loadConversations()`:
   - `GET /api/messages/conversations`
   - Muestra lista de conversaciones con último mensaje

2. `loadMessages(conversationId)`:
   - `GET /api/messages/:conversationId`
   - Muestra mensajes de la conversación
   - Marca mensajes como leídos automáticamente

3. `sendMessage()`:
   - `POST /api/messages/:conversationId`
   - Recarga mensajes después de enviar

### Endpoints:
- `POST /api/messages` - Iniciar nueva conversación (con `recipientId`)
- `POST /api/messages/:conversationId` - Enviar mensaje a conversación existente
- `GET /api/messages/conversations` - Obtener todas las conversaciones del usuario
- `GET /api/messages/:conversationId` - Obtener mensajes de una conversación

---

## 🔔 Sistema de Notificaciones

### Modelo (`rv-back/models/Notification.js`)
- Campos:
  - `user`: destinatario de la notificación
  - `type`: 'message', 'new_follower', 'garment_interest', 'system'
  - `title`: título de la notificación
  - `message`: cuerpo del mensaje
  - `relatedUser`, `relatedGarment`, `relatedConversation`: referencias opcionales
  - `isRead`: boolean
  - `readAt`: fecha de lectura

### Generación Automática:
- **Al enviar mensaje** (`rv-back/controllers/messageController.js`):
  - Después de crear Message, se llama `createNotification()`
  - Crea notificación tipo 'message' para el destinatario
  - Incluye nombre del remitente y preview del mensaje

### Frontend (`rv-front/src/components/Notifications.jsx`)
1. **Polling cada 10 segundos**:
   - `GET /api/notifications/unread-count`
   - Actualiza badge rojo con número de no leídas

2. **Al abrir dropdown**:
   - `GET /api/notifications?limit=20`
   - Muestra lista de notificaciones

3. **Acciones**:
   - Click en notificación → marca como leída + navega (mensajes o prenda)
   - "Leer todas" → marca todas como leídas
   - Botón X → elimina notificación

### Endpoints:
- `GET /api/notifications` - Obtener notificaciones (con query params: limit, unreadOnly)
- `GET /api/notifications/unread-count` - Contar no leídas
- `PUT /api/notifications/:id/read` - Marcar como leída
- `PUT /api/notifications/read-all` - Marcar todas como leídas
- `DELETE /api/notifications/:id` - Eliminar notificación

---

## 🗺️ Sistema de Mapas

### Geocoding (`rv-front/src/utils/geocoding.js`)
- Usa **Nominatim** (OpenStreetMap) para reverse geocoding
- `reverseGeocode(lat, lng)`: convierte coordenadas → city, country, address

### Integración en Publicación:
1. Usuario hace click en mapa (`Publish.jsx`)
2. Se obtienen coordenadas [lng, lat]
3. Se llama `reverseGeocode()` para obtener información textual
4. Se guarda `location` con:
   - `coordinates: [lng, lat]`
   - `city`, `country`, `address` (del reverse geocoding)

### Visualización:
- `Explore.jsx`: Mapa centrado en ubicación del usuario (o Santiago por defecto)
- `Detail.jsx`: Mapa con marcador en la ubicación de la prenda
- `Publish.jsx` / `EditGarment.jsx`: Mapa interactivo para seleccionar ubicación

---

## 📁 Manejo de Archivos

### Backend (`rv-back/middleware/uploadMiddleware.js`)
- **Multer** configuración:
  - Almacenamiento: `diskStorage` en `/uploads`
  - Nombre: `{fieldname}-{timestamp}{extensión}`
  - Filtro: solo imágenes (jpeg, jpg, png, gif, webp)
  - Límite: 5MB por archivo

### Servir Archivos Estáticos (`rv-back/server.js`)
- `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`
- URLs: `http://localhost:5000/uploads/foto-123456.jpg`

---

## 🔄 Flujo de Datos Típico

### Ejemplo: Usuario publica una prenda

1. **Frontend - Publish.jsx**:
   ```
   Usuario completa formulario
   → Selecciona fotos
   → Hace click en mapa (obtiene coordenadas)
   → reverseGeocode() → obtiene city/country
   → onSubmit() crea FormData
   → api.post('/garments', formData)
   ```

2. **Backend - postRoutes.js**:
   ```
   POST /api/garments
   → authMiddleware (verifica JWT)
   → upload.array('photos') (guarda archivos)
   → createPost (controlador)
   ```

3. **Backend - postController.js**:
   ```
   createPost()
   → Parsea FormData (fotos → URLs, location → objeto)
   → Valida datos
   → Post.create({ title, description, photos, location, user })
   → Responde con post creado
   ```

4. **Frontend**:
   ```
   Recibe respuesta
   → navigate('/explore') o '/profile'
   ```

### Ejemplo: Usuario envía mensaje

1. **Frontend - Detail.jsx**:
   ```
   Click "Contactar al vendedor"
   → Modal con textarea
   → messageService.startConversation(recipientId, message)
   ```

2. **Backend - messageController.js**:
   ```
   sendMessage()
   → Busca/Crea Conversation
   → Crea Message
   → createNotification(recipientId, 'message', ...)
   → Responde con message
   ```

3. **Backend - notificationController.js**:
   ```
   createNotification()
   → Notification.create({ user, type, title, message, ... })
   → Guarda en MongoDB
   ```

4. **Frontend - Notifications.jsx**:
   ```
   Polling cada 10 segundos
   → GET /notifications/unread-count
   → Actualiza badge rojo
   → Usuario abre dropdown
   → GET /notifications
   → Muestra lista
   ```

---

## 🛡️ Seguridad

1. **Autenticación JWT**:
   - Tokens válidos por 30 días
   - Middleware protege rutas privadas
   - Tokens almacenados en localStorage

2. **Validación de Datos**:
   - `express-validator` en backend
   - `react-hook-form` + `yup` en frontend

3. **Protección de Recursos**:
   - Usuarios solo pueden editar/eliminar sus propias prendas
   - Mensajes solo visibles para participantes de la conversación

4. **Hashing de Contraseñas**:
   - `bcrypt` con 10 rounds
   - Nunca se almacenan contraseñas en texto plano

---

## 📡 Comunicación Frontend-Backend

### Servicio API (`rv-front/src/services/api.js`)
- Instancia de Axios configurada con:
  - Base URL: `http://localhost:5000/api`
  - Interceptor: agrega `Authorization: Bearer <token>` a todas las peticiones
  - Manejo de errores centralizado
  - Timeout: 10 segundos

### Servicios:
- `authService`: login, register, getProfile
- `userService`: updateProfile
- `garmentService`: CRUD de prendas
- `messageService`: conversaciones y mensajes
- `notificationService`: notificaciones

---

## 🎨 Frontend - Estructura de Componentes

### Pages:
- `Home.jsx`: Página inicial con prendas destacadas
- `Explore.jsx`: Explorar todas las prendas con filtros y mapa
- `Detail.jsx`: Vista detallada de prenda + botón contactar
- `Publish.jsx`: Formulario para publicar nueva prenda
- `EditGarment.jsx`: Editar prenda existente
- `Profile.jsx`: Perfil del usuario con sus prendas
- `Messages.jsx`: Sistema de mensajería completo

### Components:
- `HeaderHome.jsx`: Navegación con menú y botón de notificaciones
- `Notifications.jsx`: Dropdown de notificaciones con polling
- `ProtectedRoute.jsx`: Wrapper para rutas privadas
- `ErrorBoundary.jsx`: Captura errores de React y muestra fallback

### Context:
- `AuthContext.jsx`: Estado global de autenticación

---

## 🗄️ Base de Datos (MongoDB)

### Colecciones:
1. **users**: Información de usuarios
2. **posts**: Publicaciones de prendas
3. **messages**: Mensajes individuales
4. **conversations**: Conversaciones entre usuarios
5. **notifications**: Notificaciones del sistema

### Índices:
- `users.email`: único
- `conversations.participants`: índice compuesto
- `notifications.user + isRead + createdAt`: índice compuesto para búsquedas eficientes
- `posts.location`: índice 2dsphere para búsquedas geográficas

---

## 🚀 Inicio de la Aplicación

### Backend:
```bash
cd rv-back
npm install
npm run dev
# Puerto: 5000
```

### Frontend:
```bash
cd rv-front
npm install
npm run dev
# Puerto: 3000
```

### Variables de Entorno:
- **Backend** (`.env`): `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`
- **Frontend** (`.env`): `VITE_API_URL`

---

## 📊 Flujo de Usuario Típico

1. **Registro/Login** → Obtiene token JWT
2. **Publicar Prenda** → Sube fotos, selecciona ubicación, guarda en DB
3. **Explorar** → Ve todas las prendas disponibles
4. **Ver Detalle** → Click en prenda → página con info completa
5. **Contactar** → Envía mensaje → crea conversación + notificación
6. **Mensajes** → Chatea con otros usuarios
7. **Notificaciones** → Recibe alertas de nuevos mensajes
8. **Perfil** → Ve y edita sus propias prendas

---

## 🔧 Tecnologías Clave

- **React 18**: Framework frontend
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Estilos utilitarios
- **React Router DOM**: Navegación
- **Axios**: Peticiones HTTP
- **React Hook Form + Yup**: Formularios y validación
- **Leaflet + React Leaflet**: Mapas interactivos
- **Node.js + Express**: Backend REST API
- **MongoDB + Mongoose**: Base de datos NoSQL
- **JWT**: Autenticación stateless
- **bcrypt**: Hashing de contraseñas
- **Multer**: Manejo de archivos
- **express-validator**: Validación de datos en backend

---

## 📝 Notas Importantes

1. **FormData**: Se usa para envío de archivos (fotos) desde frontend
2. **GeoJSON**: Formato estándar para almacenar ubicaciones en MongoDB
3. **Polling**: Notificaciones se actualizan cada 10 segundos (no es tiempo real)
4. **Tokens**: Se renuevan en cada login (30 días de validez)
5. **Archivos**: Se guardan localmente en `/uploads`, no en cloud storage
6. **Mapas**: Usa OpenStreetMap (gratis), no requiere API key