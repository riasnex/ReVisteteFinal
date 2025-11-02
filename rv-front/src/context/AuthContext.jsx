import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            // Verificar si el token sigue siendo válido (solo si el backend está disponible)
            try {
              await authService.getProfile();
              setUser(userData);
              setIsAuthenticated(true);
            } catch (error) {
              // Si falla la verificación, limpiar datos inválidos
              console.warn('Token inválido o servidor no disponible, limpiando sesión:', error.message);
              logout();
            }
          } catch (parseError) {
            console.error('Error al parsear datos de usuario:', parseError);
            logout();
          }
        }
      } catch (error) {
        console.error('Error en initAuth:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      console.log('Respuesta del login:', response);
      
      // Manejar diferentes formatos de respuesta del backend
      const token = response.token || response.data?.token;
      const userData = response.user || response.data?.user || response.data;
      
      if (!token) {
        console.error('No se recibió token del servidor');
        return {
          success: false,
          error: 'No se recibió token del servidor. Verifica la respuesta del backend.',
        };
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response) {
        // El servidor respondió con un error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:5000';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      console.log('Respuesta del registro:', response);
      
      // Manejar diferentes formatos de respuesta del backend
      const token = response.token || response.data?.token;
      const newUser = response.user || response.data?.user || response.data;
      
      if (!token) {
        console.error('No se recibió token del servidor');
        return {
          success: false,
          error: 'No se recibió token del servidor. Verifica la respuesta del backend.',
        };
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = 'Error al registrarse';
      
      if (error.response) {
        // El servidor respondió con un error
        errorMessage = error.response.data?.message || 
                      error.response.data?.error ||
                      error.response.data?.errors?.[0]?.msg ||
                      `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:5000';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

