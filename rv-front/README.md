# ReVístete Frontend

Frontend del proyecto ReVístete - Plataforma colaborativa para reciclaje y reutilización de ropa.

## 🚀 Tecnologías

- **React.js** con **Vite**
- **Tailwind CSS** para estilos
- **React Router DOM** para navegación
- **Context API** para estado global
- **Axios** para peticiones HTTP
- **React Hook Form + Yup** para validación de formularios
- **Lucide React** para iconos
- **Leaflet + React Leaflet** para mapas (OpenStreetMap - completamente gratis)

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
- `VITE_API_URL`: URL del backend (por defecto: http://localhost:5000/api)

**Nota:** Los mapas usan OpenStreetMap vía Leaflet, que es completamente gratuito y no requiere token.

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Construir para producción:
```bash
npm run build
```

## 📁 Estructura del Proyecto

```
rv-front/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── context/         # Context API (Autenticación)
│   ├── services/        # Servicios API
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── package.json
└── vite.config.js
```

## 🎯 Funcionalidades

- ✅ Autenticación (Login/Registro)
- ✅ Perfil de usuario con QR
- ✅ Publicación de prendas
- ✅ Exploración con filtros
- ✅ Mapa con geolocalización
- ✅ Sistema de mensajería
- ✅ Notificaciones

## 🌐 Rutas

- `/` - Página de inicio
- `/profile` - Perfil del usuario
- `/publish` - Publicar nueva prenda
- `/explore` - Explorar prendas disponibles
- `/messages` - Mensajería entre usuarios

