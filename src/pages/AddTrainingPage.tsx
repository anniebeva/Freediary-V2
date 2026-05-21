import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrainingType, 
  PoolExercise, 
  DepthExercise, 
  GymExercise 
} from '../types/Training';
import { v4 as uuidv4 } from 'uuid';
import { trainingAPI, exerciseAPI } from '../api';

const AddTrainingPage: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [trainingType, setTrainingType] = useState<TrainingType>(TrainingType.Pool);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  // Validation states
  const [errors, setErrors] = useState<{
    difficulty?: string;
    poolSize?: string;
    wetsuit?: string;
    temperature?: string;
    location?: string;
    exercises?: string;
  }>({});

  // Специфические состояния для разных типов тренировок
  const [poolTraining, setPoolTraining] = useState({
    poolSize: 0
  });

  const [depthTraining, setDepthTraining] = useState({
    wetsuit: 0,
    temperature: 0,
    location: '',
    maxDepth: 0
  });

  const [gymTraining, setGymTraining] = useState({
    avgHeartRate: 0,
    maxHeartRate: 0,
    calories: 0
  });

  const [poolExercises, setPoolExercises] = useState<PoolExercise[]>([]);
  const [depthExercises, setDepthExercises] = useState<DepthExercise[]>([]);
  const [gymExercises, setGymExercises] = useState<GymExercise[]>([]);

  const handleAddPoolExercise = () => {
    const newExercise: PoolExercise = {
      id: uuidv4(),
      name: 'Новое упражнение',
      notes: ''
    };
    setPoolExercises([...poolExercises, newExercise]);
  };

  const handleAddDepthExercise = () => {
    const newExercise: DepthExercise = {
      id: uuidv4(),
      name: 'Новое упражнение',
      depth: 0,
      notes: ''
    };
    setDepthExercises([...depthExercises, newExercise]);
  };

  const handleAddGymExercise = () => {
    const newExercise: GymExercise = {
      id: uuidv4(),
      name: 'Новое упражнение',
      sets: 3,
      reps: 10,
      interval: 60,
      notes: ''
    };
    setGymExercises([...gymExercises, newExercise]);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate difficulty
    if (difficulty < 1 || difficulty > 5) {
      newErrors.difficulty = 'Сложность должна быть от 1 до 5';
    }

    // Validate specific training type fields
    if (trainingType === TrainingType.Pool) {
      if (poolTraining.poolSize <= 0) {
        newErrors.poolSize = 'Укажите корректный размер бассейна';
      }
      if (poolExercises.length === 0) {
        newErrors.exercises = 'Добавьте хотя бы одно упражнение';
      }
    }

    if (trainingType === TrainingType.Depth) {
      if (depthTraining.wetsuit <= 0) {
        newErrors.wetsuit = 'Укажите толщину костюма';
      }
      if (depthTraining.temperature <= 0) {
        newErrors.temperature = 'Укажите температуру воды';
      }
      if (!depthTraining.location.trim()) {
        newErrors.location = 'Укажите локацию';
      }
      if (depthExercises.length === 0) {
        newErrors.exercises = 'Добавьте хотя бы одно упражнение';
      }
    }

    if (trainingType === TrainingType.Gym) {
      if (gymExercises.length === 0) {
        newErrors.exercises = 'Добавьте хотя бы одно упражнение';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setSubmitError(null);
    
    try {
      // Подготовка данных для API с правильным форматом
      const today = new Date();
      
      // Создаем базовый объект данных
      const trainingData: any = {
        type: trainingType,
        date: today.toISOString().split('T')[0], // Формат YYYY-MM-DD
        difficulty: difficulty,
      };
      
      // Добавляем notes только если они есть
      if (notes.trim()) {
        trainingData.notes = notes;
      }
      
      // Добавляем специфические поля только для соответствующих типов тренировок
      if (trainingType === TrainingType.Pool) {
        trainingData.poolTraining = poolTraining;
      } else if (trainingType === TrainingType.Depth) {
        trainingData.depthTraining = depthTraining;
      } else if (trainingType === TrainingType.Gym) {
        trainingData.gymTraining = gymTraining;
      }

      // Создание тренировки
      const createdTraining = await trainingAPI.create(trainingData);
      
      // Создание упражнений
      const exercises = trainingType === TrainingType.Pool ? poolExercises :
                       trainingType === TrainingType.Depth ? depthExercises :
                       gymExercises;
      
      for (const exercise of exercises) {
        const exerciseData = {
          name: exercise.name,
          reps: 'reps' in exercise ? exercise.reps : 1,
          sets: 'sets' in exercise ? exercise.sets : 1,
          weight: 0, // По умолчанию
          notes: exercise.notes || undefined,
          training_id: createdTraining.id,
        };
        await exerciseAPI.create(exerciseData);
      }
      
      navigate('/trainings');
    } catch (err: any) {
      let errorMessage = 'Не удалось сохранить тренировку. Попробуйте позже.';
      
      // Пытаемся получить более детальную информацию об ошибке
      if (err.message && err.message.includes('422')) {
        errorMessage = 'Ошибка валидации данных. Проверьте правильность заполнения полей.';
      } else if (err.message && err.message.includes('401')) {
        errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему.';
      } else if (err.message && err.message.includes('500')) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      }
      
      setSubmitError(errorMessage);
      console.error('Error saving training:', err);
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
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Очень легко</span>
            <span>Легко</span>
            <span>Средне</span>
            <span>Сложно</span>
            <span>Очень сложно</span>
          </div>
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
          <div>
          <input 
            type="text" 
            inputMode="numeric" 
            pattern="[0-9]*"
            value={poolTraining.poolSize}
            onChange={(e) => {
              const inputValue = e.target.value.replace(/^0+/, '');
              setPoolTraining({...poolTraining, poolSize: inputValue === '' ? 0 : Number(inputValue)});
            }}
            onKeyDown={(e) => {
              // Prevent negative sign and non-numeric input
              if (e.key === '-' || (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete')) {
                e.preventDefault();
              }
            }}
            className={`w-full px-3 py-2 border rounded ${
              poolTraining.poolSize <= 0 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="Введите длину бассейна"
          />
            {poolTraining.poolSize <= 0 && (
              <p className="text-red-500 text-sm mt-1">
                Укажите корректный размер бассейна
              </p>
            )}
          </div>
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
                placeholder="Толщина неопренового костюма"
              />
            </div>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Температура воды (°C)</label>
              <input 
                type="number" 
                value={depthTraining.temperature}
                onChange={(e) => setDepthTraining({...depthTraining, temperature: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
                placeholder="Температура воды"
              />
            </div>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Локация</label>
              <input 
                type="text" 
                value={depthTraining.location}
                onChange={(e) => setDepthTraining({...depthTraining, location: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                placeholder="Место тренировки"
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
                placeholder="Средний пульс за тренировку"
              />
            </div>
            <div className="mb-4">
              <label className="block text-water-dark font-bold mb-2">Калории</label>
              <input 
                type="number" 
                value={gymTraining.calories}
                onChange={(e) => setGymTraining({...gymTraining, calories: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded"
                placeholder="Количество сожженных калорий"
              />
            </div>
          </>
        )}

        <div className="border-t border-water-light pt-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-water-medium">Упражнения</h2>
            <button 
              type="button"
              onClick={
                trainingType === TrainingType.Pool ? handleAddPoolExercise :
                trainingType === TrainingType.Depth ? handleAddDepthExercise :
                handleAddGymExercise
              }
              className="bg-water-medium text-white px-3 py-1 rounded hover:bg-water-dark transition"
            >
              + Добавить упражнение
            </button>
          </div>

          {trainingType === TrainingType.Pool && poolExercises.map((exercise, index) => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3 flex justify-between items-center"
            >
              <div className="w-full">
                <input 
                  type="text"
                  value={exercise.name}
                  onChange={(e) => {
                    const updatedExercises = [...poolExercises];
                    updatedExercises[index].name = e.target.value;
                    setPoolExercises(updatedExercises);
                  }}
                  className="font-semibold mb-2 w-full px-2 py-1 rounded"
                  placeholder="Название упражнения"
                />
                <textarea 
                  value={exercise.notes || ''}
                  onChange={(e) => {
                    const updatedExercises = [...poolExercises];
                    updatedExercises[index].notes = e.target.value;
                    setPoolExercises(updatedExercises);
                  }}
                  className="w-full px-2 py-1 rounded"
                  placeholder="Заметки об упражнении"
                />
              </div>
              <button 
                type="button"
                onClick={() => setPoolExercises(poolExercises.filter(ex => ex.id !== exercise.id))}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition ml-2"
              >
                Удалить
              </button>
            </div>
          ))}

          {trainingType === TrainingType.Depth && depthExercises.map((exercise, index) => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3 flex justify-between items-center"
            >
              <div className="w-full">
                <input 
                  type="text"
                  value={exercise.name}
                  onChange={(e) => {
                    const updatedExercises = [...depthExercises];
                    updatedExercises[index].name = e.target.value;
                    setDepthExercises(updatedExercises);
                  }}
                  className="font-semibold mb-2 w-full px-2 py-1 rounded"
                  placeholder="Название упражнения"
                />
                <div className="flex space-x-2 mb-2">
                  <input 
                    type="number"
                    value={exercise.depth || 0}
                    onChange={(e) => {
                      const updatedExercises = [...depthExercises];
                      updatedExercises[index].depth = Number(e.target.value);
                      setDepthExercises(updatedExercises);
                    }}
                    placeholder="Глубина (м)"
                    className="w-full px-2 py-1 rounded"
                  />
                </div>
                <textarea 
                  value={exercise.notes || ''}
                  onChange={(e) => {
                    const updatedExercises = [...depthExercises];
                    updatedExercises[index].notes = e.target.value;
                    setDepthExercises(updatedExercises);
                  }}
                  className="w-full px-2 py-1 rounded"
                  placeholder="Заметки об упражнении"
                />
              </div>
              <button 
                type="button"
                onClick={() => setDepthExercises(depthExercises.filter(ex => ex.id !== exercise.id))}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition ml-2"
              >
                Удалить
              </button>
            </div>
          ))}

          {trainingType === TrainingType.Gym && gymExercises.map((exercise, index) => (
            <div 
              key={exercise.id} 
              className="bg-water-light/50 rounded p-3 mb-3 flex justify-between items-center"
            >
              <div className="w-full">
                <input 
                  type="text"
                  value={exercise.name}
                  onChange={(e) => {
                    const updatedExercises = [...gymExercises];
                    updatedExercises[index].name = e.target.value;
                    setGymExercises(updatedExercises);
                  }}
                  className="font-semibold mb-2 w-full px-2 py-1 rounded"
                  placeholder="Название упражнения"
                />
                <div className="flex space-x-2 mb-2">
                  <input 
                    type="number" 
                    value={exercise.sets}
                    onChange={(e) => {
                      const updatedExercises = [...gymExercises];
                      updatedExercises[index].sets = Number(e.target.value);
                      setGymExercises(updatedExercises);
                    }}
                    placeholder="Подходы"
                    className="w-full px-2 py-1 rounded"
                  />
                  <input 
                    type="number" 
                    value={exercise.reps}
                    onChange={(e) => {
                      const updatedExercises = [...gymExercises];
                      updatedExercises[index].reps = Number(e.target.value);
                      setGymExercises(updatedExercises);
                    }}
                    placeholder="Повторы"
                    className="w-full px-2 py-1 rounded"
                  />
                </div>
                <textarea 
                  value={exercise.notes || ''}
                  onChange={(e) => {
                    const updatedExercises = [...gymExercises];
                    updatedExercises[index].notes = e.target.value;
                    setGymExercises(updatedExercises);
                  }}
                  className="w-full px-2 py-1 rounded"
                  placeholder="Заметки об упражнении"
                />
              </div>
              <button 
                type="button"
                onClick={() => setGymExercises(gymExercises.filter(ex => ex.id !== exercise.id))}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition ml-2"
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
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Сохранение...
              </>
            ) : 'Сохранить тренировку'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTrainingPage;