import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authAPI } from '../api/index';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Инициализация sessionId для гостевых пользователей
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('User not authenticated:', error);
        // Создаем sessionId для гостя
        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('sessionId', sessionId);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      
      // Токен теперь хранится в httpOnly cookie, не нужно сохранять в localStorage
      // Получаем данные пользователя
      const userData = await authAPI.getMe();
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Удаляем sessionId при успешной авторизации
      localStorage.removeItem('sessionId');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await authAPI.register({ username, email, password });
      // После регистрации сразу входим
      await login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
  // Всегда вызываем logout API для удаления cookie на сервере
    authAPI.logout().catch(console.error);
    
    setUser(null);
    setIsAuthenticated(false);
    
    // Создаем новую сессию для гостя
    const sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
    
    // 👇 ДОБАВИТЬ РЕДИРЕКТ НА СТРАНИЦУ ВХОДА
    window.location.href = '/login';
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      return await authAPI.getMe();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">Загрузка...</div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};