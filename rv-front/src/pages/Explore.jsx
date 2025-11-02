import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeaderHome from '../components/HeaderHome';
import { garmentService } from '../services/api';
import { Search, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix para los iconos de Leaflet en Vite
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Configurar iconos por defecto
try {
  delete (L.Icon.Default.prototype)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
  });
} catch (error) {
  console.warn('Error al configurar iconos de Leaflet:', error);
}

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    size: '',
    gender: '',
    state: '',
    search: '',
  });
  const [showMap, setShowMap] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Determinar centro del mapa basado en ubicación del usuario
  const getMapCenter = () => {
    if (user?.location?.coordinates && user.location.coordinates.length === 2) {
      return [user.location.coordinates[1], user.location.coordinates[0]]; // [lat, lng]
    }
    // Centro por defecto: Santiago, Chile (más cercano a Providencia)
    return [-33.4489, -70.6693];
  };

  useEffect(() => {
    loadGarments();
  }, [filters]);

  const loadGarments = async () => {
    setLoading(true);
    try {
      const data = await garmentService.getAll(filters);
      // Asegurarnos de que siempre sea un array
      let garments = [];
      if (Array.isArray(data)) {
        garments = data;
      } else if (data?.posts && Array.isArray(data.posts)) {
        garments = data.posts;
      } else if (data?.garments && Array.isArray(data.garments)) {
        garments = data.garments;
      } else if (data?.data && Array.isArray(data.data)) {
        garments = data.data;
      }
      setGarments(garments);
    } catch (error) {
      console.error('Error al cargar prendas:', error);
      // Si hay error, dejar array vacío en lugar de crashear
      setGarments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filtrar prendas que tienen ubicación para el mapa
  const garmentsWithLocation = garments.filter(
    (garment) => garment.location?.coordinates && garment.location.coordinates.length === 2
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Explorar Prendas
          </h1>

          {/* Filtros */}
          <div className="card mb-8">
            <div className="flex flex-wrap items-center gap-4">
              {/* Búsqueda */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar prendas..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Filtros */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input-field"
              >
                <option value="">Todas las categorías</option>
                <option value="camisetas">Camisetas</option>
                <option value="pantalones">Pantalones</option>
                <option value="vestidos">Vestidos</option>
                <option value="abrigos">Abrigos</option>
                <option value="zapatos">Zapatos</option>
                <option value="accesorios">Accesorios</option>
              </select>

              <select
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                className="input-field"
              >
                <option value="">Todas las tallas</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>

              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="input-field"
              >
                <option value="">Todos los géneros</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
                <option value="unisex">Unisex</option>
                <option value="niño">Niño</option>
                <option value="niña">Niña</option>
              </select>

              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="input-field"
              >
                <option value="">Todos los estados</option>
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
              </select>

              <button
                onClick={() => setShowMap(!showMap)}
                className="btn-secondary flex items-center space-x-2"
              >
                <MapPin className="w-5 h-5" />
                <span>{showMap ? 'Ocultar Mapa' : 'Ver en Mapa'}</span>
              </button>
            </div>
          </div>

          {/* Mapa */}
              {showMap && (
            <div className="card mb-8">
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={getMapCenter()}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  key={JSON.stringify(getMapCenter())} // Forzar re-render si cambia el centro
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {garmentsWithLocation.map((garment) => (
                    <Marker
                      key={garment._id || garment.id}
                      position={[
                        garment.location.coordinates[1], // Latitud
                        garment.location.coordinates[0], // Longitud
                      ]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm">{garment.title}</h3>
                          <p className="text-xs text-gray-600">{garment.category}</p>
                          {garment.photos && garment.photos[0] && (
                            <img
                              src={garment.photos[0]}
                              alt={garment.title}
                              className="w-24 h-24 object-cover rounded mt-2"
                            />
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              {garmentsWithLocation.length === 0 && (
                <p className="text-center text-gray-500 text-sm mt-2 p-2">
                  No hay prendas con ubicación disponible
                </p>
              )}
            </div>
          )}

          {/* Lista de Prendas */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando prendas...</p>
            </div>
          ) : garments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No se encontraron prendas con esos filtros</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {garments.map((garment) => (
                <div
                  key={garment._id || garment.id}
                  className="card cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/garment/${garment._id || garment.id}`)}
                >
                  {garment.photos && garment.photos[0] && (
                    <img
                      src={garment.photos[0]}
                      alt={garment.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-semibold text-lg mb-2">{garment.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{garment.category}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{garment.size}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        garment.state === 'new'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {garment.state === 'new' ? 'Nuevo' : 'Usado'}
                    </span>
                  </div>
                  {garment.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{garment.location.city || 'Ubicación disponible'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
