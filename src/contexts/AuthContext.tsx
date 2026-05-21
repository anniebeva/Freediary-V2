import React, { createContext, useState, useContext, ReactNode } from 'react';
import { authAPI } from '../api/index';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Инициализация sessionId для гостевых пользователей
  React.useEffect(() => {
    const initializeSession = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Если пользователь не авторизован, создаем или получаем sessionId
        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          // Генерируем простой sessionId
          sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('sessionId', sessionId);
        }
      } else {
        // Если пользователь авторизован, удаляем sessionId
        localStorage.removeItem('sessionId');
      }
    };

    initializeSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login({ username, password });
      
      // Предполагаем, что API возвращает данные пользователя
      const userData: User = {
        id: response.id || '1',
        username: response.username || username,
        email: response.email || `${username}@example.com`
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.token || 'mock-token');
      // Удаляем sessionId при успешной авторизации
      localStorage.removeItem('sessionId');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authAPI.register({ username, email, password });
      
      // Предполагаем, что API возвращает данные пользователя
      const userData: User = {
        id: response.id || '2',
        username: response.username || username,
        email: response.email || email
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.token || 'mock-token');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Вызываем API logout если есть токен
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.logout().catch(console.error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Проверяем localStorage при инициализации
  React.useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    if (storedAuth === 'true' && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
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
