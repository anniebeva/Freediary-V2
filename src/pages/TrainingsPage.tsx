import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Training } from '../types/Training';
import { trainingAPI } from '../api';

const TrainingsPage: React.FunctionComponent = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
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
      setTrainings(formattedTrainings);
    } catch (err) {
      setError('Не удалось загрузить тренировки. Попробуйте позже.');
      console.error('Error fetching trainings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    try {
      await trainingAPI.delete(id);
      setTrainings(trainings.filter(training => training.id !== id));
    } catch (err) {
      setError('Не удалось удалить тренировку. Попробуйте позже.');
      console.error('Error deleting training:', err);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-water-dark">Мои тренировки</h1>
        <Link 
          to="/add-training" 
          className="bg-water-medium text-white px-4 py-2 rounded hover:bg-water-dark transition"
        >
          + Добавить тренировку
        </Link>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-water-medium"></div>
          <p className="mt-2 text-gray-600">Загрузка тренировок...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={fetchTrainings}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && trainings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">У вас пока нет тренировок.</p>
          <Link 
            to="/add-training" 
            className="inline-block mt-2 bg-water-medium text-white px-4 py-2 rounded hover:bg-water-dark transition"
          >
            Создать первую тренировку
          </Link>
        </div>
      )}

      {!loading && !error && trainings.map(training => (
        <div 
          key={training.id} 
          className="bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center hover:shadow-lg transition"
        >
          <div>
            <h2 className="text-lg font-semibold text-water-medium">
              {training.type}
            </h2>
            <p className="text-gray-600">
              {training.date.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })} • Сложность: {training.difficulty}/5
            </p>
          </div>
          <div className="flex space-x-2">
            <Link 
              to={`/training/${training.id}`} 
              className="bg-water-light text-water-dark px-3 py-1 rounded hover:bg-water-medium hover:text-white transition"
            >
              Детали
            </Link>
            <button 
              onClick={() => handleDeleteTraining(training.id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrainingsPage;
