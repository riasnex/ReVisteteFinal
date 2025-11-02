# Solución de Problemas - Autenticación

## Problema: No puedo registrarme ni iniciar sesión

### Pasos para depurar:

1. **Verifica que el backend esté ejecutándose**
   - El backend debe estar corriendo en `http://localhost:5000`
   - Verifica que las rutas `/api/auth/register` y `/api/auth/login` existan

2. **Abre la consola del navegador (F12)**
   - Ve a la pestaña "Console"
   - Intenta registrarte o iniciar sesión
   - Revisa los mensajes de error que aparecen

3. **Verifica la URL de la API**
   - En la consola deberías ver: `API_URL configurada: http://localhost:5000/api`
   - Si es diferente, edita el archivo `.env` y agrega:
     ```
     VITE_API_URL=http://localhost:5000/api
     ```

4. **Revisa los errores comunes:**

   **Error: "No se pudo conectar con el servidor"**
   - El backend no está ejecutándose
   - La URL de la API es incorrecta
   - Problema de CORS (el backend debe permitir requests desde `http://localhost:3000`)

   **Error: "401 Unauthorized" o "403 Forbidden"**
   - Las credenciales son incorrectas
   - El usuario ya existe (en registro)
   - El token ha expirado

   **Error: "400 Bad Request"**
   - Falta algún campo requerido
   - El formato de los datos es incorrecto
   - Revisa la consola para ver qué datos se están enviando

5. **Verifica el formato de respuesta del backend**
   
   El frontend espera que el backend responda con uno de estos formatos:
   
   ```json
   {
     "token": "jwt_token_aqui",
     "user": {
       "id": "123",
       "name": "Juan",
       "email": "juan@email.com"
     }
   }
   ```
   
   O:
   
   ```json
   {
     "data": {
       "token": "jwt_token_aqui",
       "user": {
         "id": "123",
         "name": "Juan",
         "email": "juan@email.com"
       }
     }
   }
   ```

6. **Si el backend tiene un formato diferente**, necesitarás:
   - Modificar `AuthContext.jsx` para adaptar el formato de respuesta
   - O modificar el backend para que responda en el formato esperado

### Campos requeridos para registro:
- name (nombre completo)
- email
- password (mínimo 6 caracteres)
- phone (teléfono)
- address (dirección)

### Campos requeridos para login:
- email
- password

