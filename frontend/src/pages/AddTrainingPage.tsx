import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainingType } from '../types/Training';
import { v4 as uuidv4 } from 'uuid';
import { trainingAPI, exerciseAPI } from '../api';

const mapTrainingTypeToAPI = (type: TrainingType): string => {
  switch (type) {
    case TrainingType.Pool:
      return 'Pool';
    case TrainingType.Depth:
      return 'Depth';
    case TrainingType.Gym:
      return 'Gym';
    default:
      return 'Other';
  }
};

interface Exercise {
  id: string;
  name: string;
  notes: string;
}

const AddTrainingPage: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [trainingType, setTrainingType] = useState<TrainingType>(TrainingType.Pool);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Специфические состояния для разных типов тренировок
  const [poolTraining, setPoolTraining] = useState({ poolSize: 0 });
  const [depthTraining, setDepthTraining] = useState({
    wetsuit: 0,
    temperature: 0,
    location: '',
  });
  const [gymTraining, setGymTraining] = useState({
    avgHeartRate: 0,
    calories: 0,
  });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: uuidv4(),
      name: 'Новое упражнение',
      notes: '',
    };
    setExercises([...exercises, newExercise]);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleExerciseChange = (id: string, field: keyof Exercise, value: string) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const validateForm = (): boolean => {
    const emptyName = exercises.some(ex => !ex.name.trim());
    if (emptyName) {
      setSubmitError('У всех упражнений должно быть название');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setSubmitError(null);
    
    try {
      const trainingData: any = {
        type: mapTrainingTypeToAPI(trainingType),
        date: date,
        difficulty: difficulty,
      };
      
      if (notes.trim()) {
        trainingData.notes = notes;
      }
      
      if (trainingType === TrainingType.Pool) {
        trainingData.poolTraining = poolTraining;
      } else if (trainingType === TrainingType.Depth) {
        trainingData.depthTraining = depthTraining;
      } else if (trainingType === TrainingType.Gym) {
        trainingData.gymTraining = gymTraining;
      }
      console.log('📤 trainingData перед отправкой:', trainingData);

      const createdTraining = await trainingAPI.create(trainingData);
      
      // Создание упражнений
      for (const exercise of exercises) {
        const exerciseData = {
          name: exercise.name,
          notes: exercise.notes || undefined,
          training_id: createdTraining.id,
        };
        await exerciseAPI.create(exerciseData);
      }
      
      // Отправляем цель в Яндекс Метрику
      if (typeof window !== 'undefined' && window.ym) {
        window.ym(109707102, 'reachGoal', 'create_training');
      }
      
      navigate('/trainings');
    } catch (err: any) {
      console.error('Error saving training:', err);
      let errorMessage = 'Не удалось сохранить тренировку. Попробуйте позже.';
      
      if (err.message && err.message.includes('422')) {
        errorMessage = 'Ошибка валидации данных. Проверьте правильность заполнения полей.';
      } else if (err.message && err.message.includes('401')) {
        errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему.';
      } else if (err.message && err.message.includes('500')) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      }
      
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-water-dark mb-6">Добавить тренировку</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-water-dark font-bold mb-2">Тип тренировки</label>
          <select 
            value={trainingType} 
            onChange={(e) => setTrainingType(e.target.value as TrainingType)}
            className="w-full px-3 py-2 border rounded"
          >
            {Object.values(TrainingType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-water-dark font-bold mb-2">Дата тренировки</label>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-water-dark font-bold mb-2">
            Сложность тренировки: {difficulty}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-water-dark font-bold mb-2">Заметки</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Дополнительные заметки о тренировке"
          />
        </div>

        {/* Специфические поля для разных типов тренировок */}
        {trainingType === TrainingType.Pool && (
          <div className="mb-4">
            <label className="block text-water-dark font-bold mb-2">Размер бассейна (м)</label>
            <input 
              type="number" 
              value={poolTraining.poolSize}
              onChange={(e) => setPoolTraining({ poolSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Введите длину бассейна"
            />
          </div>
        )}

        {trainingType === TrainingType.Depth && (
          <>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Толщина костюма (мм)</label>
              <input 
                type="number" 
                value={depthTraining.wetsuit}
                onChange={(e) => setDepthTraining({...depthTraining, wetsuit: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Температура воды (°C)</label>
              <input 
                type="number" 
                value={depthTraining.temperature}
                onChange={(e) => setDepthTraining({...depthTraining, temperature: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Локация</label>
              <input 
                type="text" 
                value={depthTraining.location}
                onChange={(e) => setDepthTraining({...depthTraining, location: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </>
        )}

        {trainingType === TrainingType.Gym && (
          <>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Средний пульс</label>
              <input 
                type="number" 
                value={gymTraining.avgHeartRate}
                onChange={(e) => setGymTraining({...gymTraining, avgHeartRate: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Калории</label>
              <input 
                type="number" 
                value={gymTraining.calories}
                onChange={(e) => setGymTraining({...gymTraining, calories: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </>
        )}

        {/* Упражнения — единый блок для всех типов */}
        <div className="border-t border-water-light pt-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-water-medium">Упражнения</h2>
            <button 
              type="button"
              onClick={handleAddExercise}
              className="bg-water-medium text-white px-3 py-1 rounded hover:bg-water-dark transition"
            >
              + Добавить упражнение
            </button>
          </div>

          {exercises.length === 0 && (
            <p className="text-gray-500 text-center py-4">Нет упражнений.</p>
          )}

          {exercises.map((exercise) => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3 flex justify-between items-start gap-2"
            >
              <div className="flex-1">
                <input 
                  type="text"
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)}
                  className="font-semibold mb-2 w-full px-2 py-1 rounded border"
                  placeholder="Название упражнения"
                />
                <textarea 
                  value={exercise.notes}
                  onChange={(e) => handleExerciseChange(exercise.id, 'notes', e.target.value)}
                  className="w-full px-2 py-1 rounded border"
                  placeholder="Заметки об упражнении"
                  rows={2}
                />
              </div>
              <button 
                type="button"
                onClick={() => handleRemoveExercise(exercise.id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{submitError}</p>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded transition ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-water-medium text-white hover:bg-water-dark'
            }`}
          >
            {loading ? 'Сохранение...' : 'Сохранить тренировку'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTrainingPage;