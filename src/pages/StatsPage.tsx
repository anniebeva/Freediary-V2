import React from 'react';
import { mockTrainings } from '../data/mockTrainings';
import { TrainingType } from '../types/Training';

const StatsPage: React.FunctionComponent = () => {
  // Базовая статистика
  const totalTrainings = mockTrainings.length;
  const trainingsByType = mockTrainings.reduce((acc, training) => {
    acc[training.type] = (acc[training.type] || 0) + 1;
    return acc;
  }, {} as Record<TrainingType, number>);

  const averageDifficulty = 
    mockTrainings.reduce((sum, training) => sum + training.difficulty, 0) / totalTrainings;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-water-dark mb-6">Статистика тренировок</h1>
      
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
    </div>
  );
};

export default StatsPage;