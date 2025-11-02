import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import HeaderHome from '../components/HeaderHome';
import { garmentService } from '../services/api';
import { Upload, X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import { reverseGeocode } from '../utils/geocoding';

// Fix iconos Leaflet
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

const schema = yup.object({
  title: yup.string().required('El título es obligatorio'),
  description: yup.string().required('La descripción es obligatoria'),
  category: yup.string().required('La categoría es obligatoria'),
  size: yup.string().required('La talla es obligatoria'),
  gender: yup.string().required('El género es obligatorio'),
  state: yup.string().oneOf(['new', 'used']).required('El estado es obligatorio'),
  // photos se valida manualmente antes de enviar
});

// Componente para capturar clicks en el mapa
function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

const Publish = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  
  // Determinar centro inicial del mapa
  const getInitialMapCenter = () => {
    // Si el usuario tiene ubicación guardada, usarla
    if (user?.location?.coordinates && user.location.coordinates.length === 2) {
      return [user.location.coordinates[1], user.location.coordinates[0]]; // [lat, lng]
    }
    // Si no, intentar usar la ubicación del navegador
    return null; // Se establecerá cuando se obtenga
  };

  const [mapCenter, setMapCenter] = useState(getInitialMapCenter() || [-33.4489, -70.6693]); // Santiago, Chile por defecto (más cercano a Providencia)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    setValue('photos', newPhotos);
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setValue('photos', newPhotos);
  };

  const handleLocationSelect = async (lat, lng) => {
    setGeocodingLoading(true);
    
    // Primero establecer las coordenadas
    const tempLocation = {
      latitude: lat,
      longitude: lng,
      coordinates: [lng, lat], // [longitude, latitude] para MongoDB
      city: 'Buscando...',
      country: ''
    };
    setSelectedLocation(tempLocation);

    // Hacer geocoding inverso para obtener la ciudad y país
    try {
      const geoData = await reverseGeocode(lat, lng);
      
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        coordinates: [lng, lat],
        city: geoData.city || 'Ubicación desconocida',
        country: geoData.country || 'País desconocido',
        address: geoData.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        coordinates: [lng, lat],
        city: 'Ubicación desconocida',
        country: 'País desconocido',
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    } finally {
      setGeocodingLoading(false);
    }
  };

  // Obtener ubicación actual del usuario (opcional)
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          await handleLocationSelect(latitude, longitude);
        },
        (error) => {
          console.warn('Error al obtener ubicación:', error);
          setError('No se pudo obtener tu ubicación. Por favor, selecciona manualmente en el mapa.');
        }
      );
    } else {
      setError('Tu navegador no soporta geolocalización. Por favor, selecciona manualmente en el mapa.');
    }
  };

  // Intentar obtener ubicación inicial del usuario al cargar
  useEffect(() => {
    if (!showMap) return;
    
    // Si el usuario tiene ubicación guardada, usarla como centro
    if (user?.location?.coordinates && user.location.coordinates.length === 2) {
      const [lng, lat] = user.location.coordinates;
      setMapCenter([lat, lng]);
    } else if (navigator.geolocation) {
      // Intentar obtener ubicación del navegador
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        () => {
          // Si falla, mantener el centro por defecto
        }
      );
    }
  }, [showMap, user]);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      // Validar que haya al menos una foto
      if (!photos || photos.length === 0) {
        setError('Debes subir al menos una foto');
        setLoading(false);
        return;
      }

      await garmentService.create({
        ...data,
        photos: photos, // Array de archivos File
        location: selectedLocation, // Agregar ubicación
      });
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al publicar la prenda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Publicar Nueva Prenda
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                {...register('title')}
                className="input-field"
                placeholder="Ej: Camiseta blanca de algodón"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                {...register('description')}
                className="input-field"
                rows="4"
                placeholder="Describe la prenda, su estado, tamaño, etc."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select {...register('category')} className="input-field">
                <option value="">Selecciona una categoría</option>
                <option value="camisetas">Camisetas</option>
                <option value="pantalones">Pantalones</option>
                <option value="vestidos">Vestidos</option>
                <option value="abrigos">Abrigos</option>
                <option value="zapatos">Zapatos</option>
                <option value="accesorios">Accesorios</option>
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Talla y Género */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Talla *
                </label>
                <select {...register('size')} className="input-field">
                  <option value="">Selecciona una talla</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
                {errors.size && (
                  <p className="text-red-600 text-sm mt-1">{errors.size.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género *
                </label>
                <select {...register('gender')} className="input-field">
                  <option value="">Selecciona género</option>
                  <option value="hombre">Hombre</option>
                  <option value="mujer">Mujer</option>
                  <option value="unisex">Unisex</option>
                  <option value="niño">Niño</option>
                  <option value="niña">Niña</option>
                </select>
                {errors.gender && (
                  <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('state')}
                    value="new"
                    className="mr-2"
                  />
                  <span>Nuevo</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register('state')}
                    value="used"
                    className="mr-2"
                  />
                  <span>Usado</span>
                </label>
              </div>
              {errors.state && (
                <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
              )}
            </div>

            {/* Fotos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-600">Haz clic para subir fotos</span>
                  <span className="text-sm text-gray-500 mt-1">
                    Puedes subir múltiples imágenes
                  </span>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && (
                <p className="text-red-600 text-sm mt-1">Debes subir al menos una foto</p>
              )}
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación (Opcional)
              </label>
              <div className="flex space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <MapPin className="w-5 h-5" />
                  <span>{showMap ? 'Ocultar Mapa' : 'Seleccionar en Mapa'}</span>
                </button>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="btn-secondary text-sm"
                >
                  Usar Mi Ubicación
                </button>
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation(null);
                      setShowMap(false);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Eliminar Ubicación
                  </button>
                )}
              </div>

              {selectedLocation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  {geocodingLoading ? (
                    <p className="text-sm text-green-800">
                      <strong>Buscando ubicación...</strong>
                    </p>
                  ) : (
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">Ubicación seleccionada:</p>
                      <p>{selectedLocation.address || `${selectedLocation.city}, ${selectedLocation.country}`}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Coordenadas: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {showMap && (
                <div className="border border-gray-300 rounded-lg overflow-hidden mb-2">
                  <div className="h-64 w-full">
                    <MapContainer
                      center={mapCenter}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker onLocationSelect={handleLocationSelect} />
                      {selectedLocation && (
                        <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
                      )}
                    </MapContainer>
                  </div>
                  <p className="text-xs text-gray-500 p-2 bg-gray-50">
                    Haz clic en el mapa para seleccionar la ubicación de la prenda
                  </p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publicando...' : 'Publicar Prenda'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Publish;

