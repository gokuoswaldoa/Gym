import Dexie from 'dexie';

export const db = new Dexie('GymTrackerDB');

db.version(5).stores({
  workouts: '++id, date, type, notes',
  exercises: '++id, name, category', 
  sets: '++id, workoutId, exerciseId, reps, weight, completed',
  cardioLogs: '++id, workoutId, duration, distance',
  bodyWeightLogs: '++id, date, weight',
  plannedRoutines: '++id, name, *days',
  nutritionLogs: '++id, date, mealType', // Ej: { date: '2026-09-19', mealType: 'pre-workout', foods: [...] }
  customFoods: '++id, name, category, p, c, f, digestion'
});

// Seed some default exercises if the DB is empty
db.on('populate', () => {
  db.exercises.bulkAdd([
    { name: 'Bench Press', category: 'Chest' },
    { name: 'Squat', category: 'Legs' },
    { name: 'Deadlift', category: 'Back' },
    { name: 'Pull-up', category: 'Back' },
    { name: 'Overhead Press', category: 'Shoulders' },
    { name: 'Bicep Curl', category: 'Arms' },
    { name: 'Tricep Extension', category: 'Arms' },
    { name: 'Treadmill', category: 'Cardio' },
    { name: 'Cycling', category: 'Cardio' }
  ]);
});
