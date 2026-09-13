import Dexie from 'dexie';

export const db = new Dexie('GymTrackerDB');

db.version(2).stores({
  workouts: '++id, date, type, notes', // date can be an ISO string
  exercises: '++id, name, category', // e.g. Chest, Back, Legs, Cardio
  sets: '++id, workoutId, exerciseId, reps, weight, completed',
  cardioLogs: '++id, workoutId, duration, distance',
  bodyWeightLogs: '++id, date, weight'
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
