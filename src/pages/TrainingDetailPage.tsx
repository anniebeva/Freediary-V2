import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockTrainings } from '../data/mockTrainings';
import { 
  Training, 
  TrainingType, 
  PoolExercise, 
  DepthExercise, 
  GymExercise 
} from '../types/Training';

const TrainingDetailPage: React.FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const training = mockTrainings.find(t => t.id === id);

  if (!training) {
    return <div>Тренировка не найдена</div>;
  }

  const handleDeleteTraining = () => {
    const index = mockTrainings.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTrainings.splice(index, 1);
    }
    navigate('/trainings');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-water-dark">
            {training.type} - {training.date.toLocaleDateString('ru-RU', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}
          </h1>
          <div className="space-x-2">
            <Link 
              to={`/edit-training/${training.id}`}
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
          
          {training.type === TrainingType.Pool && training.poolTraining?.poolSize && (
            <p className="text-gray-700">Размер бассейна: {training.poolTraining.poolSize} м</p>
          )}
          
          {training.type === TrainingType.Depth && training.depthTraining && (
            <>
              {training.depthTraining.wetsuit && (
                <p className="text-gray-700">Толщина костюма: {training.depthTraining.wetsuit} мм</p>
              )}
              {training.depthTraining.temperature && (
                <p className="text-gray-700">Температура воды: {training.depthTraining.temperature}°C</p>
              )}
              {training.depthTraining.location && (
                <p className="text-gray-700">Локация: {training.depthTraining.location}</p>
              )}
            </>
          )}
          
          {training.type === TrainingType.Gym && training.gymTraining && (
            <>
              {training.gymTraining.avgHeartRate && (
                <p className="text-gray-700">Средний пульс: {training.gymTraining.avgHeartRate}</p>
              )}
              {training.gymTraining.calories && (
                <p className="text-gray-700">Калории: {training.gymTraining.calories}</p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-water-light pt-4">
          <h2 className="text-2xl font-semibold text-water-medium mb-4">Упражнения</h2>
          
          {training.type === TrainingType.Pool && (training.exercises as PoolExercise[]).map(exercise => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3"
            >
              <h3 className="font-semibold">{exercise.name}</h3>
              {exercise.notes && <p className="text-gray-600">{exercise.notes}</p>}
            </div>
          ))}

          {training.type === TrainingType.Depth && (training.exercises as DepthExercise[]).map(exercise => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3"
            >
              <h3 className="font-semibold">{exercise.name}</h3>
              {exercise.depth !== undefined && (
                <p className="text-gray-600">Глубина: {exercise.depth} м</p>
              )}
              {exercise.notes && <p className="text-gray-600">{exercise.notes}</p>}
            </div>
          ))}

          {training.type === TrainingType.Gym && (training.exercises as GymExercise[]).map(exercise => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3"
            >
              <h3 className="font-semibold">{exercise.name}</h3>
              <p className="text-gray-600">
                Подходы: {exercise.sets}, Повторы: {exercise.reps}
              </p>
              {exercise.notes && <p className="text-gray-600">{exercise.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingDetailPage;