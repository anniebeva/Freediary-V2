import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FunctionComponent = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [level, setLevel] = useState('Начинающий');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Реализовать сохранение профиля
    alert('Профиль обновлен');
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-water-dark mb-4">Вы не авторизованы</h2>
          <p className="text-water-dark mb-6">Пожалуйста, войдите в систему, чтобы просмотреть профиль</p>
          <a 
            href="/login" 
            className="bg-water-medium text-white py-2 px-6 rounded hover:bg-water-dark transition inline-block"
          >
            Войти
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-water-dark mb-6">Профиль</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-water-dark mb-4">Информация о пользователе</h2>
          <div className="mb-4">
            <p className="text-water-dark font-bold">Имя пользователя:</p>
            <p className="text-water-medium">{user.username}</p>
          </div>
          <div className="mb-4">
            <p className="text-water-dark font-bold">Email:</p>
            <p className="text-water-medium">{user.email}</p>
          </div>
          <div className="mb-6">
            <p className="text-water-dark font-bold">ID пользователя:</p>
            <p className="text-water-medium text-sm">{user.id}</p>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
          >
            Выйти из профиля
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-water-dark mb-4">Настройки профиля</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Отображаемое имя</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-water-light rounded focus:outline-none focus:ring-2 focus:ring-water-medium"
              />
            </div>

            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Email для уведомлений</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-water-light rounded focus:outline-none focus:ring-2 focus:ring-water-medium"
              />
            </div>

            <div className="mb-6">
              <label className="block text-water-dark font-bold mb-2">Уровень подготовки</label>
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-water-light rounded focus:outline-none focus:ring-2 focus:ring-water-medium"
              >
                <option value="Начинающий">Начинающий</option>
                <option value="Любитель">Любитель</option>
                <option value="Профессионал">Профессионал</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full bg-water-medium text-white py-3 rounded hover:bg-water-dark transition"
            >
              Сохранить настройки
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
