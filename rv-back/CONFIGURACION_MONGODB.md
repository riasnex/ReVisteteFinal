# 🔧 Configuración de MongoDB Atlas

## Pasos para obtener las credenciales correctas:

### 1. Obtener la URI de conexión desde MongoDB Atlas

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Inicia sesión en tu cuenta
3. Selecciona tu cluster (en tu caso: `revistete`)
4. Haz clic en **"Connect"**
5. Elige **"Connect your application"**
6. Selecciona **"Node.js"** como driver
7. Copia la URI que aparece

### 2. Reemplazar el placeholder de contraseña

La URI que te da MongoDB tiene un placeholder `<password>`. Debes:
- Reemplazar `<password>` con la contraseña real de tu usuario de MongoDB
- Si no recuerdas la contraseña, puedes crear un nuevo usuario en MongoDB Atlas:
  - Ve a "Database Access" en el menú lateral
  - Crea un nuevo usuario o edita uno existente
  - Guarda la contraseña (no la podrás ver después)

### 3. Formato correcto de la URI

Tu URI debería verse así (con tu contraseña real):

```
MONGODB_URI=mongodb+srv://ignfuentes:TU_CONTRASEÑA_REAL@revistete.3fdbomz.mongodb.net/revistete?retryWrites=true&w=majority
```

**Nota importante:**
- Reemplaza `TU_CONTRASEÑA_REAL` con tu contraseña real
- Si tu contraseña tiene caracteres especiales, puedes necesitar codificarlos en URL:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - etc.

### 4. Agregar el nombre de la base de datos

En la URI, después del dominio, agrega `/revistete` antes del `?`:
```
mongodb+srv://usuario:password@revistete.3fdbomz.mongodb.net/revistete?retryWrites=true&w=majority
                                                                    ^^^^^^^^^^
                                                                    Nombre de la BD
```

### 5. Verificar la IP en la whitelist

Asegúrate de que tu IP esté en la lista blanca de MongoDB Atlas:
1. Ve a "Network Access" en el menú lateral
2. Haz clic en "Add IP Address"
3. Puedes agregar tu IP actual o usar `0.0.0.0/0` para permitir todas las IPs (solo para desarrollo)

### 6. Ejemplo de archivo .env correcto

```env
PORT=5000

MONGODB_URI=mongodb+srv://ignfuentes:mi_password_segura@revistete.3fdbomz.mongodb.net/revistete?retryWrites=true&w=majority

JWT_SECRET=mi_secret_super_seguro_123456789abcdefghijklmnop
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:3000
```

### Solución rápida

Si quieres probar rápidamente, puedes usar MongoDB Compass o crear un nuevo usuario en Atlas con una contraseña simple (sin caracteres especiales) para evitar problemas de codificación.

