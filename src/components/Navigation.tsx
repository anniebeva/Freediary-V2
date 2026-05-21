import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Навигационное меню с водной тематикой
const Navigation: React.FunctionComponent = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-water-medium text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-water-light transition">
          FreeDiary
        </Link>
        <div className="space-x-4">
          <Link 
            to="/trainings" 
            className="hover:bg-water-dark px-3 py-2 rounded-md transition"
          >
            Тренировки
          </Link>
          <Link 
            to="/add-training" 
            className="hover:bg-water-dark px-3 py-2 rounded-md transition"
          >
            Добавить
          </Link>
          <Link 
            to="/stats" 
            className="hover:bg-water-dark px-3 py-2 rounded-md transition"
          >
            Статистика
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link 
                to="/profile" 
                className="hover:bg-water-dark px-3 py-2 rounded-md transition"
              >
                Профиль
              </Link>
              <button
                onClick={logout}
                className="hover:bg-water-dark px-3 py-2 rounded-md transition"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hover:bg-water-dark px-3 py-2 rounded-md transition"
              >
                Войти
              </Link>
              <Link 
                to="/register" 
                className="hover:bg-water-dark px-3 py-2 rounded-md transition"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
