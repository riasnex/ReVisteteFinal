# 📊 Cómo Ver Usuarios en la Base de Datos

Hay varias formas de ver los usuarios creados en MongoDB:

## Opción 1: MongoDB Atlas (Interfaz Web) ⭐ RECOMENDADO

### Pasos:
1. Ve a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Inicia sesión con tu cuenta
3. Selecciona tu cluster (`revistete`)
4. Haz clic en **"Browse Collections"** o **"Collections"**
5. Selecciona la base de datos **`revistete`** (o el nombre que hayas configurado)
6. Haz clic en la colección **`users`**
7. Aquí verás todos los usuarios registrados

### Información que verás:
- `_id`: ID único del usuario
- `name`: Nombre del usuario
- `email`: Email (único)
- `phone`: Teléfono
- `address`: Dirección
- `createdAt`: Fecha de creación
- `updatedAt`: Última actualización
- `isActive`: Si el usuario está activo
- ⚠️ **NO verás la contraseña** (está hasheada y no se muestra por seguridad)

## Opción 2: MongoDB Compass (Aplicación Desktop)

### Instalación:
1. Descarga [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Instala la aplicación
3. Conéctate usando tu URI de MongoDB:
   ```
   mongodb+srv://usuario:password@revistete.3fdbomz.mongodb.net/revistete
   ```

### Ver usuarios:
1. Selecciona la base de datos `revistete`
2. Abre la colección `users`
3. Verás todos los documentos (usuarios) en formato JSON

## Opción 3: Script de Node.js (Línea de comandos)

He creado un script para ver usuarios desde la terminal:

### Ejecutar:
```bash
cd rv-back
node scripts/viewUsers.js
```

Esto mostrará:
- Total de usuarios
- Lista de usuarios con sus datos (sin contraseña)
- Fecha de creación
- ID de cada usuario

## Opción 4: Usando el Backend API

### Obtener perfil de un usuario:
```bash
# Necesitas el ID del usuario primero
GET http://localhost:5000/api/users/:userId
```

### Obtener tu propio perfil:
```bash
# Necesitas estar autenticado
GET http://localhost:5000/api/auth/me
Headers: Authorization: Bearer <tu_token>
```

## Estructura de un Usuario en la Base de Datos

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "phone": "+34 123 456 789",
  "address": "Calle Principal 123, Madrid",
  "location": {
    "type": "Point",
    "coordinates": [-3.7038, 40.4168],
    "city": "Madrid",
    "country": "España"
  },
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "__v": 0
}
```

## ⚠️ Notas Importantes

- **Las contraseñas NO se almacenan en texto plano**, están hasheadas con bcrypt
- El campo `password` se oculta automáticamente en las respuestas de la API
- Para ver contraseñas (hasheadas) necesitarías acceso directo a MongoDB Atlas o Compass
- En MongoDB Atlas/Compass puedes editar documentos directamente si necesitas

## 🔍 Filtrar y Buscar en MongoDB Atlas

En MongoDB Atlas puedes:
- **Buscar por email**: `{ "email": "juan@email.com" }`
- **Buscar por nombre**: `{ "name": { "$regex": "Juan", "$options": "i" } }`
- **Ordenar**: Por fecha de creación, nombre, etc.
- **Exportar**: Descargar los datos como JSON o CSV

