import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = requireAuth ? '/login' : '/trainings'
}) => {
  const { isAuthenticated } = useAuth();  
  const location = useLocation();

  // Если требуется авторизация, но пользователь не авторизован - редирект на логин
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Если не требуется авторизация (логин/регистрация), но пользователь авторизован - редирект на главную
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;