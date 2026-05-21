import { Training, TrainingType, PoolExercise, DepthExercise, GymExercise } from '../types/Training';
import { v4 as uuidv4 } from 'uuid';

export const mockTrainings: Training[] = [
  {
    id: uuidv4(),
    type: TrainingType.Pool,
    date: new Date('2024-01-15'),
    difficulty: 3,
    notes: 'Первая тренировка после перерыва',
    poolTraining: {
      poolSize: 25
    },
    exercises: [
      {
        id: uuidv4(),
        name: 'Статика',
        notes: 'Задержка дыхания'
      } as PoolExercise,
      {
        id: uuidv4(),
        name: 'Динамика',
        notes: 'Плавание под водой'
      } as PoolExercise
    ]
  },
  {
    id: uuidv4(),
    type: TrainingType.Depth,
    date: new Date('2024-02-20'),
    difficulty: 5,
    notes: 'Тренировка на открытой воде',
    depthTraining: {
      wetsuit: 5,
      temperature: 18,
      location: 'Черное море',
      maxDepth: 20
    },
    exercises: [
      {
        id: uuidv4(),
        name: 'Погружение',
        depth: 15,
        notes: 'Статическая задержка на глубине'
      } as DepthExercise
    ]
  },
  {
    id: uuidv4(),
    type: TrainingType.Gym,
    date: new Date('2024-03-10'),
    difficulty: 4,
    notes: 'Силовая тренировка',
    gymTraining: {
      avgHeartRate: 130,
      maxHeartRate: 160,
      calories: 450
    },
    exercises: [
      {
        id: uuidv4(),
        name: 'Жим лежа',
        sets: 3,
        reps: 10,
        interval: 90,
        notes: 'Разминочный вес'
      } as GymExercise
    ]
  }
];