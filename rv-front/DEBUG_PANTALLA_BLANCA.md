# 🔍 Debug: Pantalla en Blanco

## Problema
Las páginas se muestran por medio segundo y luego se ponen en blanco.

## Soluciones implementadas

### 1. ErrorBoundary agregado
- Captura errores de JavaScript que crashean la app
- Muestra mensaje de error en lugar de pantalla en blanco

### 2. Mejoras en AuthContext
- `logout()` ahora está definido antes de ser usado
- Manejo mejorado de errores en `initAuth`
- No crashea si el backend no está disponible

### 3. Manejo de errores en llamadas API
- Todos los `catch` ahora manejan errores sin crashear
- Arrays vacíos en lugar de errores no manejados

### 4. Interceptor de Axios mejorado
- No redirige infinitamente
- Solo limpia sesión cuando es necesario

## Cómo depurar

### 1. Abre la consola del navegador (F12)
Revisa si hay errores en:
- **Console** - Busca errores en rojo
- **Network** - Verifica si las peticiones fallan

### 2. Errores comunes a buscar:

**Error: "Cannot read property 'X' of undefined"**
- Alguna variable está undefined
- Revisa los logs en consola para ver qué variable

**Error: "Failed to fetch" o "Network Error"**
- El backend no está corriendo
- Verifica que `http://localhost:5000` esté disponible

**Error: "useAuth must be used within AuthProvider"**
- Problema con el contexto
- Ya debería estar solucionado

**Error relacionado con Leaflet o mapbox**
- Problema con mapas
- Debería estar manejado ahora

### 3. Verificar que el servidor esté corriendo

Frontend:
```bash
cd rv-front
npm run dev
```

Backend:
```bash
cd rv-back
npm run dev
```

### 4. Verificar variables de entorno

Asegúrate de que `rv-front/.env` tenga:
```
VITE_API_URL=http://localhost:5000/api
```

### 5. Limpiar cache y reinstalar

Si el problema persiste:
```bash
# En rv-front
rm -rf node_modules package-lock.json
npm install

# Reiniciar el servidor
npm run dev
```

## Comportamiento esperado ahora

- Si hay un error, deberías ver el ErrorBoundary con un mensaje
- Si no hay error, las páginas deberían cargar normalmente
- Si el backend no está disponible, las páginas deberían cargar pero sin datos

## Si el problema persiste

1. Abre la consola (F12)
2. Copia TODOS los errores que aparezcan
3. Verifica la pestaña Network para ver qué peticiones fallan
4. Comparte la información para poder ayudar mejor

