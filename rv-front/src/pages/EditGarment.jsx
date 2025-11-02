import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const EditGarment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [existingPhotos, setExistingPhotos] = useState([]); // Fotos existentes (URLs)
  const [newPhotos, setNewPhotos] = useState([]); // Nuevas fotos (File objects)
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-33.4489, -70.6693]); // Santiago, Chile por defecto
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadGarmentData();
  }, [id]);

  const loadGarmentData = async () => {
    try {
      const data = await garmentService.getById(id);
      const garment = data.post || data.garment || data;
      
      // Cargar datos en el formulario
      reset({
        title: garment.title || '',
        description: garment.description || '',
        category: garment.category || '',
        size: garment.size || '',
        gender: garment.gender || '',
        state: garment.state || 'used',
      });

      // Cargar fotos existentes
      if (garment.photos && Array.isArray(garment.photos)) {
        setExistingPhotos(garment.photos);
      }

      // Cargar ubicación
      if (garment.location && garment.location.coordinates) {
        const [lng, lat] = garment.location.coordinates;
        setSelectedLocation({
          latitude: lat,
          longitude: lng,
          coordinates: [lng, lat],
          city: garment.location.city || null,
          country: garment.location.country || null,
          address: garment.location.address || null
        });
        setMapCenter([lat, lng]);
        
        // Si no tiene ciudad, hacer geocoding
        if (!garment.location.city) {
          reverseGeocode(lat, lng).then(geoData => {
            setSelectedLocation(prev => ({
              ...prev,
              city: geoData.city || prev.city,
              country: geoData.country || prev.country,
              address: geoData.address || prev.address
            }));
          });
        }
      }
    } catch (err) {
      console.error('Error al cargar prenda:', err);
      setError('No se pudo cargar la información de la prenda');
    } finally {
      setLoadingData(false);
    }
  };

  const handleNewPhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos([...newPhotos, ...files]);
  };

  const removeExistingPhoto = (index) => {
    const updated = existingPhotos.filter((_, i) => i !== index);
    setExistingPhotos(updated);
  };

  const removeNewPhoto = (index) => {
    const updated = newPhotos.filter((_, i) => i !== index);
    setNewPhotos(updated);
  };

  const handleLocationSelect = async (lat, lng) => {
    setGeocodingLoading(true);
    
    const tempLocation = {
      latitude: lat,
      longitude: lng,
      coordinates: [lng, lat],
      city: 'Buscando...',
      country: ''
    };
    setSelectedLocation(tempLocation);

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

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      // Verificar que haya al menos una foto (existente o nueva)
      if ((!existingPhotos || existingPhotos.length === 0) && (!newPhotos || newPhotos.length === 0)) {
        setError('Debes tener al menos una foto');
        setLoading(false);
        return;
      }

      // Preparar datos para actualizar
      // Combinar URLs existentes (strings) con nuevos archivos (File objects)
      const allPhotos = [...existingPhotos, ...newPhotos];
      
      const updateData = {
        ...data,
        photos: allPhotos, // Array mixto: URLs (strings) + File objects
        location: selectedLocation,
      };

      await garmentService.update(id, updateData);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar la prenda');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderHome />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Editar Prenda
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

            {/* Fotos Existentes */}
            {existingPhotos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotos Actuales
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {existingPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agregar Nuevas Fotos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar Nuevas Fotos (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewPhotoChange}
                  className="hidden"
                  id="new-photo-upload"
                />
                <label
                  htmlFor="new-photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-600">Haz clic para agregar más fotos</span>
                </label>
              </div>

              {newPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {newPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Nueva foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
                      <p className="font-semibold mb-1">Ubicación:</p>
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
                {loading ? 'Guardando...' : 'Guardar Cambios'}
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

export default EditGarment;

