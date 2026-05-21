import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FunctionComponent = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/profile');
    } catch (err) {
      setError('Ошибка при регистрации. Попробуйте позже.');
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-water-dark mb-6 text-center">Регистрация</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-water-dark mb-2" htmlFor="username">
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-water-light rounded-md focus:outline-none focus:ring-2 focus:ring-water-medium"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-water-dark mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-water-light rounded-md focus:outline-none focus:ring-2 focus:ring-water-medium"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-water-dark mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-water-light rounded-md focus:outline-none focus:ring-2 focus:ring-water-medium"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-water-dark mb-2" htmlFor="confirmPassword">
              Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-water-light rounded-md focus:outline-none focus:ring-2 focus:ring-water-medium"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-water-medium text-white py-2 px-4 rounded-md hover:bg-water-dark transition disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-water-dark">
            Уже есть аккаунт?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-water-medium hover:text-water-dark font-medium"
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;