import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { trainingAPI } from '../api';

const TrainingDetailPage: React.FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [training, setTraining] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTraining = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await trainingAPI.getById(id);
        console.log('📦 Полученная тренировка:', data);
        console.log('📦 depthTraining:', data.depthTraining);
        console.log('📦 gymTraining:', data.gymTraining);
        console.log('📦 exercises:', data.exercises);
        setTraining(data);
      } catch (err: any) {
        console.error('Error fetching training:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTraining();
  }, [id]);

  const handleDeleteTraining = async () => {
    if (!id) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить эту тренировку?')) {
      return;
    }
    
    try {
      await trainingAPI.delete(id);
      if (window.ym) {
        window.ym(109707102, 'reachGoal', 'delete_training');
      }
      // Сохраняем сообщение в localStorage перед переходом
      localStorage.setItem('deleteMessage', 'Тренировка успешно удалена');
      navigate('/trainings');
    } catch (err: any) {
      console.error('Error deleting training:', err);
      setError('Не удалось удалить тренировку');
      // Скрываем сообщение об ошибке через 3 секунды
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error || !training) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Тренировка не найдена</p>
          <Link to="/trainings" className="text-water-dark underline mt-2 inline-block">
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

 console.log('🔍 depthTraining:', training.depthTraining);
console.log('🔍 poolTraining:', training.poolTraining);
console.log('🔍 gymTraining:', training.gymTraining);
console.log('🔍 Ключи depthTraining:', Object.keys(training.depthTraining || {}));
  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-water-dark">
            {training.type} - {formatDate(training.date)}
          </h1>
          <div className="space-x-2">
            <Link 
              to={`/trainings/${training.id}/edit`}
              className="bg-water-medium text-white px-4 py-2 rounded hover:bg-water-dark transition"
            >
              Изменить
            </Link>
            <button 
              onClick={handleDeleteTraining}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Удалить
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700">Сложность: {training.difficulty}/5</p>
          {training.notes && <p className="text-gray-700">Заметки: {training.notes}</p>}
          
          {/* Бассейн */}
          {training.type === 'Pool' && training.poolTraining?.poolSize && (
            <p className="text-gray-700">Размер бассейна: {training.poolTraining.poolSize} м</p>
          )}
          
          {/* Глубина — проверяем наличие полей */}
          {training.type === 'Depth' && training.depthTraining && (
            <>
              {training.depthTraining.wetsuit !== undefined && training.depthTraining.wetsuit > 0 && (
                <p className="text-gray-700">Толщина костюма: {training.depthTraining.wetsuit} мм</p>
              )}
              {training.depthTraining.temperature !== undefined && training.depthTraining.temperature > 0 && (
                <p className="text-gray-700">Температура воды: {training.depthTraining.temperature}°C</p>
              )}
              {training.depthTraining.location && (
                <p className="text-gray-700">Локация: {training.depthTraining.location}</p>
              )}
            </>
          )}
          
          {/* Зал */}
          {training.type === 'Gym' && training.gymTraining && (
            <>
              {training.gymTraining.avgHeartRate !== undefined && training.gymTraining.avgHeartRate > 0 && (
                <p className="text-gray-700">Средний пульс: {training.gymTraining.avgHeartRate}</p>
              )}
              {training.gymTraining.calories !== undefined && training.gymTraining.calories > 0 && (
                <p className="text-gray-700">Калории: {training.gymTraining.calories}</p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-water-light pt-4">
          <h2 className="text-2xl font-semibold text-water-medium mb-4">Упражнения</h2>
          
          {(!training.exercises || training.exercises.length === 0) && (
            <p className="text-gray-500 text-center py-4">Нет упражнений</p>
          )}
          
          {training.exercises?.map((exercise: any) => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3"
            >
              <h3 className="font-semibold">{exercise.name}</h3>
              {exercise.notes && <p className="text-gray-600">{exercise.notes}</p>}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <Link to="/trainings" className="text-water-dark underline">
            ← Вернуться к списку тренировок
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetailPage;