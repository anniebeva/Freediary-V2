import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trainingAPI } from '../api';
import { Training } from '../types/Training';

const HomePage: React.FunctionComponent = () => {
  const [recentTrainings, setRecentTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentTrainings();
  }, []);

  const fetchRecentTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trainingAPI.getAll();
      // Преобразование данных из API в формат фронтенда
      const formattedTrainings = data.map((training: any) => ({
        ...training,
        id: training.id.toString(),
        date: new Date(training.date),
      }));
      // Показываем последние 3 тренировки
      setRecentTrainings(formattedTrainings.slice(0, 3));
    } catch (err) {
      setError('Не удалось загрузить тренировки. Попробуйте позже.');
      console.error('Error fetching trainings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold text-water-dark mb-6">
        FreeDiary: Твой дневник фридайвинга
      </h1>
      
      <section className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl text-water-medium mb-4">Последние тренировки</h2>
        
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-water-medium"></div>
            <p className="mt-2 text-gray-600">Загрузка тренировок...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <button 
              onClick={fetchRecentTrainings}
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && recentTrainings.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-600">У вас пока нет тренировок.</p>
            <Link 
              to="/add-training" 
              className="inline-block mt-2 bg-water-medium text-white px-4 py-2 rounded hover:bg-water-dark transition"
            >
              Создать первую тренировку
            </Link>
          </div>
        )}

        {!loading && !error && recentTrainings.map(training => (
          <div 
            key={training.id} 
            className="border-b border-water-light py-4 hover:bg-water-light/20 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-water-dark font-semibold">
                  {training.type} - {training.date.toLocaleDateString('ru-RU', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-gray-600">{training.notes}</p>
              </div>
              <Link 
                to={`/training/${training.id}`} 
                className="bg-water-medium text-white px-4 py-2 rounded hover:bg-water-dark transition"
              >
                Подробнее
              </Link>
            </div>
          </div>
        ))}
        
        {!loading && !error && recentTrainings.length > 0 && (
          <Link 
            to="/trainings" 
            className="block text-center mt-4 text-water-medium hover:underline"
          >
            Посмотреть все тренировки
          </Link>
        )}
      </section>

      <div className="grid grid-cols-2 gap-6">
        <Link 
          to="/add-training" 
          className="bg-water-medium text-white p-6 rounded-lg text-center hover:bg-water-dark transition shadow-md"
        >
          <h3 className="text-2xl font-bold mb-2">Добавить тренировку</h3>
          <p>Зафиксируйте свой прогресс</p>
        </Link>
        <Link 
          to="/stats" 
          className="bg-water-accent text-white p-6 rounded-lg text-center hover:bg-water-medium transition shadow-md"
        >
          <h3 className="text-2xl font-bold mb-2">Статистика</h3>
          <p>Отслеживайте свои достижения</p>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;