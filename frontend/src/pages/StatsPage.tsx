import React, { useEffect, useState } from 'react';
import { trainingAPI } from '../api';

interface Training {
  id: number;
  type: string;
  difficulty: number;
  date: string;
  notes?: string;
}

const StatsPage: React.FunctionComponent = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        setLoading(true);
        const data = await trainingAPI.getAll();
        setTrainings(data);
      } catch (err: any) {
        console.error('Error fetching trainings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-600">Загрузка статистики...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Ошибка загрузки: {error}</p>
        </div>
      </div>
    );
  }

  // Базовая статистика
  const totalTrainings = trainings.length;
  
  const trainingsByType = trainings.reduce((acc, training) => {
    acc[training.type] = (acc[training.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageDifficulty = totalTrainings > 0
    ? trainings.reduce((sum, training) => sum + training.difficulty, 0) / totalTrainings
    : 0;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-water-dark mb-6">Статистика тренировок</h1>
      
      {totalTrainings === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500">У вас пока нет тренировок</p>
          <p className="text-gray-500 mt-2">Добавьте первую тренировку, чтобы увидеть статистику</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-water-medium mb-4">Общая статистика</h2>
            <p>Всего тренировок: {totalTrainings}</p>
            <p>Средняя сложность: {averageDifficulty.toFixed(1)}/5</p>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-water-medium mb-4">Тренировки по типам</h2>
            {Object.entries(trainingsByType).map(([type, count]) => (
              <div key={type} className="mb-2">
                <span className="text-water-dark">{type}:</span> {count} тренировок
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPage;