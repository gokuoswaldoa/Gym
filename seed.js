import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://yastddnfeddbbmrdchxp.supabase.co', 'sb_publishable_FUbXW3c8WmWgAJ_hIzSZOw_bX7ydba_');
const USER_ID = '11111111-1111-1111-1111-111111111111';

async function seedRoutines() {
  const { data: currentRecord, error: fetchError } = await supabase
    .from('backups')
    .select('*')
    .eq('id', USER_ID)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching data:', fetchError);
    return;
  }

  const appData = currentRecord ? currentRecord.data : {
    workouts: [],
    exercises: [],
    sets: [],
    bodyWeightLogs: [],
    plannedRoutines: []
  };

  if (!appData.exercises) appData.exercises = [];
  if (!appData.plannedRoutines) appData.plannedRoutines = [];

  let nextExId = appData.exercises.length > 0 ? Math.max(...appData.exercises.map(e => e.id)) + 1 : 1;
  let nextRoutId = appData.plannedRoutines.length > 0 ? Math.max(...appData.plannedRoutines.map(r => r.id)) + 1 : 1;

  const getOrAddExercise = (name, category) => {
    let ex = appData.exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (!ex) {
      ex = { id: nextExId++, name, category };
      appData.exercises.push(ex);
    }
    return ex.id;
  };

  const routinesToSeed = [
    {
      name: 'Push A (Pecho)',
      days: [1], // Lunes
      exercises: [
        getOrAddExercise('Press de pecho plano con barra', 'Pecho'),
        getOrAddExercise('Press inclinado con mancuernas', 'Pecho'),
        getOrAddExercise('Cruces de cables en polea', 'Pecho'),
        getOrAddExercise('Elevaciones laterales con mancuerna', 'Hombros'),
        getOrAddExercise('Extensión de tríceps en polea alta', 'Brazos')
      ]
    },
    {
      name: 'Pull A (Amplitud de Espalda)',
      days: [2], // Martes
      exercises: [
        getOrAddExercise('Jalón al pecho (Agarre abierto)', 'Espalda'),
        getOrAddExercise('Remo con mancuerna a una mano', 'Espalda'),
        getOrAddExercise('Face pull en polea alta', 'Hombros'),
        getOrAddExercise('Curl de bíceps con barra', 'Brazos'),
        getOrAddExercise('Curl martillo con mancuernas', 'Brazos')
      ]
    },
    {
      name: 'Legs A (Cuádriceps)',
      days: [3], // Miércoles
      exercises: [
        getOrAddExercise('Sentadilla libre o en máquina Hack', 'Piernas'),
        getOrAddExercise('Prensa de piernas (Pies al centro)', 'Piernas'),
        getOrAddExercise('Extensiones de cuádriceps en máquina', 'Piernas'),
        getOrAddExercise('Curl de isquios (Acostado o sentado)', 'Piernas'),
        getOrAddExercise('Elevación de pantorrilla de pie', 'Piernas')
      ]
    },
    {
      name: 'Push B (Hombro)',
      days: [4], // Jueves
      exercises: [
        getOrAddExercise('Press de hombro sentado (Mancuernas)', 'Hombros'),
        getOrAddExercise('Press inclinado con mancuernas', 'Pecho'),
        getOrAddExercise('Fondos en paralelas o máquina', 'Pecho'),
        getOrAddExercise('Elevaciones laterales en polea', 'Hombros'),
        getOrAddExercise('Press francés (Rompecráneos)', 'Brazos')
      ]
    },
    {
      name: 'Pull B (Densidad de Espalda)',
      days: [5], // Viernes
      exercises: [
        getOrAddExercise('Remo con barra o en máquina', 'Espalda'),
        getOrAddExercise('Jalón al pecho (Agarre estrecho)', 'Espalda'),
        getOrAddExercise('Pullover en polea alta con cuerda', 'Espalda'),
        getOrAddExercise('Curl de bíceps en banco Scott', 'Brazos'),
        getOrAddExercise('Encogimientos de hombros (Trapecio)', 'Hombros')
      ]
    },
    {
      name: 'Legs B (Isquios y Glúteo)',
      days: [6], // Sábado
      exercises: [
        getOrAddExercise('Peso muerto rumano', 'Piernas'),
        getOrAddExercise('Prensa de piernas (Pies arriba)', 'Piernas'),
        getOrAddExercise('Curl de isquios (Acostado o sentado)', 'Piernas'),
        getOrAddExercise('Zancadas (Desplantes) con mancuernas', 'Piernas'),
        getOrAddExercise('Elevación de pantorrilla sentado', 'Piernas')
      ]
    }
  ];

  for (const r of routinesToSeed) {
    // Evitar duplicados por nombre
    if (!appData.plannedRoutines.find(existing => existing.name === r.name)) {
      appData.plannedRoutines.push({
        id: nextRoutId++,
        name: r.name,
        days: r.days,
        exercises: r.exercises
      });
    }
  }

  // Usar fecha del futuro para forzar la descarga en clientes con relojes desincronizados
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const { error: upsertError } = await supabase
    .from('backups')
    .upsert({
      id: USER_ID,
      data: appData,
      created_at: futureDate.toISOString()
    });

  if (upsertError) {
    console.error('Error upserting data:', upsertError);
  } else {
    console.log('Routines seeded successfully to Supabase!');
  }
}

seedRoutines();
