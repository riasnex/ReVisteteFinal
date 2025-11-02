import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeaderHome from '../components/HeaderHome';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { garmentService } from '../services/api';
import { Recycle, Users, Heart, ArrowRight } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [featuredGarments, setFeaturedGarments] = useState([]);

  useEffect(() => {
    loadFeaturedGarments();
  }, []);

  const loadFeaturedGarments = async () => {
    try {
      const data = await garmentService.getAll({ limit: 6, featured: true });
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
      setFeaturedGarments(garments);
    } catch (error) {
      console.error('Error al cargar prendas destacadas:', error);
      // Si hay error, dejar array vacío en lugar de crashear
      setFeaturedGarments([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHome />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              ReVístete: Recicla y Reutiliza Ropa
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Únete a nuestra comunidad sostenible. Dona, intercambia y encuentra
              prendas únicas mientras cuidamos el planeta.
            </p>
            {!isAuthenticated && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowRegister(true)}
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  Registrarse
                </button>
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors border-2 border-white"
                >
                  Iniciar Sesión
                </button>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/explore')}
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center space-x-2"
              >
                <span>Explorar Prendas</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Recycle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reciclaje Sostenible</h3>
              <p className="text-gray-600">
                Dona tus prendas y dales una segunda vida. Contribuye a reducir
                el desperdicio textil.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comunidad Activa</h3>
              <p className="text-gray-600">
                Conecta con personas comprometidas con la moda sostenible y el
                cuidado del medio ambiente.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Intercambios Justos</h3>
              <p className="text-gray-600">
                Intercambia prendas con otros usuarios o encuentra ropa única a
                precios accesibles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Garments Section */}
      {featuredGarments.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Prendas Destacadas
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredGarments.map((garment) => (
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
                  <p className="text-primary-600 font-semibold">
                    {garment.state === 'new' ? 'Nuevo' : 'Usado'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
};

export default Home;

