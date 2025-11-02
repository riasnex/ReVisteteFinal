import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, User, PlusCircle, Search, MessageCircle, Bell, LogOut } from 'lucide-react';
import Notifications from './Notifications';

const HeaderHome = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
              <Home className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-800">ReVístete</span>
          </Link>

          {/* Navegación para usuarios autenticados */}
          {isAuthenticated ? (
            <nav className="flex items-center space-x-6">
              <Link
                to="/explore"
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Search className="w-5 h-5" />
                <span className="hidden md:inline">Explorar</span>
              </Link>
              <Link
                to="/publish"
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="hidden md:inline">Publicar</span>
              </Link>
              <Link
                to="/messages"
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="hidden md:inline">Mensajes</span>
              </Link>
              <Notifications />
              <Link
                to="/profile"
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">{user?.name || 'Perfil'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </nav>
          ) : (
            // Botones para usuarios no autenticados
            <div className="flex items-center space-x-4">
              <Link
                to="/explore"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Explorar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderHome;

