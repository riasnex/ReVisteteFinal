import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeaderHome from '../components/HeaderHome';
import { garmentService } from '../services/api';
import { User, Mail, Phone, MapPin, Package, Edit } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userGarments, setUserGarments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserGarments();
  }, [user]);

  const loadUserGarments = async () => {
    try {
      if (user?.id) {
        const data = await garmentService.getByUser(user.id);
        // El backend devuelve { posts: [...] } o { garments: [...] }
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
        setUserGarments(garments);
      } else {
        setUserGarments([]);
      }
    } catch (error) {
      console.error('Error al cargar prendas del usuario:', error);
      // Si hay error, dejar array vacío
      setUserGarments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="bg-primary-600 w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{user?.name}</h1>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 text-gray-700">
                <Mail className="w-5 h-5 text-primary-600" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user?.address && (
                <div className="flex items-center space-x-3 text-gray-700 md:col-span-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <span>{user.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* User Garments */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <Package className="w-6 h-6" />
                <span>Mis Prendas Publicadas</span>
              </h2>
              <button
                onClick={() => navigate('/publish')}
                className="btn-primary"
              >
                Publicar Nueva Prenda
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Cargando...</p>
              </div>
            ) : userGarments.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aún no has publicado ninguna prenda</p>
                <button
                  onClick={() => navigate('/publish')}
                  className="btn-primary"
                >
                  Publicar Mi Primera Prenda
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {Array.isArray(userGarments) && userGarments.map((garment) => (
                  <div
                    key={garment._id || garment.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/garment/${garment._id || garment.id}`)}
                  >
                    {garment.photos && garment.photos[0] && (
                      <img
                        src={garment.photos[0]}
                        alt={garment.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{garment.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{garment.category}</p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            garment.state === 'new'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {garment.state === 'new' ? 'Nuevo' : 'Usado'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-garment/${garment._id || garment.id}`);
                          }}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

