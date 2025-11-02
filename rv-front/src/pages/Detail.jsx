import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HeaderHome from '../components/HeaderHome';
import { garmentService, messageService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, User, Mail, Phone, Calendar, Package, ArrowLeft, MessageCircle, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

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

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [garment, setGarment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadGarment();
  }, [id]);

  const loadGarment = async () => {
    try {
      const data = await garmentService.getById(id);
      const garmentData = data.post || data.garment || data;
      console.log('Prenda cargada:', garmentData);
      console.log('Ubicación de la prenda:', garmentData.location);
      setGarment(garmentData);
    } catch (err) {
      console.error('Error al cargar prenda:', err);
      setError('No se pudo cargar la información de la prenda');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (error || !garment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderHome />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">{error || 'Prenda no encontrada'}</p>
            <button
              onClick={() => navigate('/explore')}
              className="btn-primary mt-4"
            >
              Volver a Explorar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const user = garment.user || {};
  const garmentOwnerId = user._id || user.id;
  const isOwner = currentUser && (currentUser._id || currentUser.id) === garmentOwnerId?.toString();
  
  // Función para iniciar conversación
  const handleStartConversation = async () => {
    if (!contactMessage.trim()) {
      alert('Por favor, escribe un mensaje');
      return;
    }

    if (!garmentOwnerId) {
      alert('No se puede contactar a este usuario');
      return;
    }

    setSendingMessage(true);
    try {
      // Iniciar conversación enviando el primer mensaje
      await messageService.startConversation(garmentOwnerId, contactMessage.trim());
      
      // Redirigir a la página de mensajes
      navigate('/messages');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Verificar si tiene ubicación válida (coordenadas no nulas)
  const hasValidCoordinates = garment.location && 
                              garment.location.coordinates && 
                              Array.isArray(garment.location.coordinates) &&
                              garment.location.coordinates.length === 2 &&
                              typeof garment.location.coordinates[0] === 'number' &&
                              typeof garment.location.coordinates[1] === 'number' &&
                              !isNaN(garment.location.coordinates[0]) &&
                              !isNaN(garment.location.coordinates[1]) &&
                              (garment.location.coordinates[0] !== 0 || garment.location.coordinates[1] !== 0);
  
  // Debug en consola
  console.log('=== DEBUG UBICACIÓN ===');
  console.log('Prenda completa:', garment);
  console.log('Location objeto:', garment.location);
  console.log('Coordenadas:', garment.location?.coordinates);
  console.log('¿Coordenadas válidas?', hasValidCoordinates);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Botón volver */}
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a Explorar</span>
          </button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Galería de Fotos */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Fotos</h2>
              {garment.photos && garment.photos.length > 0 ? (
                <div className="space-y-4">
                  <img
                    src={garment.photos[0]}
                    alt={garment.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  {garment.photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {garment.photos.slice(1).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${garment.title} ${index + 2}`}
                          className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Sin imágenes</p>
                </div>
              )}
            </div>

            {/* Información */}
            <div className="space-y-6">
              {/* Título y categoría */}
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{garment.title}</h1>
                <p className="text-lg text-gray-600 mb-4">{garment.category}</p>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      garment.state === 'new'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {garment.state === 'new' ? 'Nuevo' : 'Usado'}
                  </span>
                  <span className="text-gray-600">Talla: <strong>{garment.size}</strong></span>
                  <span className="text-gray-600">Género: <strong>{garment.gender}</strong></span>
                </div>
              </div>

              {/* Descripción */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Descripción</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{garment.description}</p>
              </div>

              {/* Información del Usuario */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Publicado por</span>
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-600 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{user.name || 'Usuario'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.address && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MapPin className="w-4 h-4" />
                      <span>{user.address}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Publicado el {new Date(garment.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {/* Botón Contactar - Solo si el usuario está autenticado y no es el dueño */}
                  {currentUser && !isOwner && (
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="btn-primary w-full mt-4 flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Contactar al vendedor</span>
                    </button>
                  )}
                  
                  {!currentUser && (
                    <button
                      onClick={() => navigate('/login')}
                      className="btn-primary w-full mt-4 flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Inicia sesión para contactar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ubicación en Mapa */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Ubicación</span>
                </h2>
                {hasValidCoordinates ? (
                  <>
                    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200">
                      <MapContainer
                        center={[garment.location.coordinates[1], garment.location.coordinates[0]]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        key={`map-${garment.location.coordinates[0]}-${garment.location.coordinates[1]}`}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[garment.location.coordinates[1], garment.location.coordinates[0]]}>
                          <Popup>
                            <div>
                              <p className="font-semibold">{garment.title}</p>
                              <p className="text-sm">{garment.location.city || garment.location.address || 'Ubicación'}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                    {(garment.location.city || garment.location.address) && (
                      <p className="text-sm text-gray-600 mt-2">
                        {garment.location.address || garment.location.city}
                        {garment.location.city && garment.location.country && `, ${garment.location.country}`}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">
                      Esta prenda no tiene ubicación especificada
                    </p>
                    {garment.location && (
                      <p className="text-xs text-gray-400 mt-2">
                        Debug: {JSON.stringify(garment.location)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Contacto */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Contactar a {user.name || 'el vendedor'}</h2>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactMessage('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Escribe un mensaje para iniciar una conversación sobre <strong>{garment.title}</strong>
            </p>
            
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Hola, me interesa esta prenda..."
              className="input-field w-full h-32 resize-none mb-4"
              disabled={sendingMessage}
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactMessage('');
                }}
                className="btn-secondary flex-1"
                disabled={sendingMessage}
              >
                Cancelar
              </button>
              <button
                onClick={handleStartConversation}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
                disabled={sendingMessage || !contactMessage.trim()}
              >
                {sendingMessage ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    <span>Enviar mensaje</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;

