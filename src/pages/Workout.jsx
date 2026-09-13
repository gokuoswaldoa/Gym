import { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, CheckCircle, TimerReset } from 'lucide-react';

export default function Workout() {
  const navigate = useNavigate();
  const exercisesDB = useLiveQuery(() => db.exercises.toArray());
  const [selectedExercise, setSelectedExercise] = useState('');
  
  // Estados para nuevo ejercicio
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('Piernas');

  // Estructura: [ { exerciseId, name, previousSets, sets: [ { reps, weight, completed } ] } ]
  const [workoutExercises, setWorkoutExercises] = useState([]);

  // Temporizador de Descanso
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isResting) {
      interval = setInterval(() => {
        setRestSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isResting]);

  const startRestTimer = () => {
    setRestSeconds(0);
    setIsResting(true);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setRestSeconds(0);
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateExercise = async () => {
    if (!newExName) return;
    const newId = await db.exercises.add({
      name: newExName,
      category: newExCategory
    });
    setSelectedExercise(newId.toString());
    setShowNewExercise(false);
    setNewExName('');
  };

  const addExercise = async () => {
    if (!selectedExercise) return;
    const ex = exercisesDB.find(e => e.id === Number(selectedExercise));
    if (ex) {
      // Buscar el rendimiento anterior para este ejercicio
      const lastSets = await db.sets.where('exerciseId').equals(ex.id).toArray();
      let previousSetsArray = [];
      if (lastSets.length > 0) {
        const workoutIds = [...new Set(lastSets.map(s => s.workoutId))];
        const workouts = await db.workouts.where('id').anyOf(workoutIds).toArray();
        workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (workouts.length > 0) {
          const latestWId = workouts[0].id;
          // Asumimos que los sets se insertaron en orden, los ordenamos por ID para mantener la secuencia
          previousSetsArray = lastSets.filter(s => s.workoutId === latestWId).sort((a,b) => a.id - b.id);
        }
      }

      setWorkoutExercises([...workoutExercises, { 
        exerciseId: ex.id, 
        name: ex.name, 
        previousSets: previousSetsArray,
        sets: [{ reps: '', weight: '', completed: false }] 
      }]);
      setSelectedExercise('');
    }
  };

  const addSet = (exerciseIndex) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets.push({ reps: '', weight: '', completed: false });
    setWorkoutExercises(updated);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets.splice(setIndex, 1);
    setWorkoutExercises(updated);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setWorkoutExercises(updated);
  };

  const toggleSetCompletion = (exerciseIndex, setIndex) => {
    const updated = [...workoutExercises];
    const isNowCompleted = !updated[exerciseIndex].sets[setIndex].completed;
    updated[exerciseIndex].sets[setIndex].completed = isNowCompleted;
    setWorkoutExercises(updated);
    
    if (isNowCompleted) {
      startRestTimer();
    }
  };

  const removeExercise = (exerciseIndex) => {
    const updated = [...workoutExercises];
    updated.splice(exerciseIndex, 1);
    setWorkoutExercises(updated);
  };

  const finishWorkout = async () => {
    if (workoutExercises.length === 0) return;

    // 1. Guardar el workout principal
    const workoutId = await db.workouts.add({
      date: new Date().toISOString(),
      type: 'Gym',
      notes: ''
    });

    // 2. Guardar cada serie asociada al workout
    const setsToSave = [];
    workoutExercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.reps && set.weight) {
          setsToSave.push({
            workoutId,
            exerciseId: ex.exerciseId,
            reps: Number(set.reps),
            weight: Number(set.weight),
            completed: set.completed
          });
        }
      });
    });

    if (setsToSave.length > 0) {
      await db.sets.bulkAdd(setsToSave);
    }
    
    // Disparar sincronización en segundo plano (si hay internet)
    import('../lib/sync').then(({ triggerSync }) => triggerSync());
    
    navigate('/history');
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Temporizador Flotante */}
      {isResting && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#111112] border-2 border-spidey-amber text-spidey-amber px-6 py-2 rounded-full shadow-[0_4px_20px_rgba(242,169,0,0.3)] flex items-center gap-4">
          <span className="font-bebas text-2xl tracking-widest">{formatTime(restSeconds)}</span>
          <button onClick={stopRestTimer} className="text-spidey-white hover:text-spidey-red transition-colors">
            <TimerReset size={20} />
          </button>
        </div>
      )}

      <h2 className="text-3xl font-bebas text-spidey-amber tracking-wide">NUEVA RUTINA</h2>
      
      {/* Selector de Ejercicio */}
      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30">
        <div className="flex justify-between items-end mb-2">
          <label className="block text-sm font-archivo text-spidey-white uppercase">
            Añadir Ejercicio
          </label>
          <button 
            onClick={() => setShowNewExercise(!showNewExercise)}
            className="text-xs font-archivo text-spidey-amber uppercase tracking-wide"
          >
            {showNewExercise ? 'Cancelar' : '+ Crear Nuevo'}
          </button>
        </div>

        {showNewExercise ? (
          <div className="space-y-3 bg-spidey-gray/10 p-3 rounded-xl border border-spidey-gray/20 mt-2">
            <input 
              type="text"
              placeholder="Nombre (ej. Extensión de Cuádriceps)"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue font-work text-sm"
            />
            <div className="flex gap-2">
              <select 
                value={newExCategory}
                onChange={e => setNewExCategory(e.target.value)}
                className="flex-1 bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue font-work text-sm"
              >
                <option value="Pecho">Pecho</option>
                <option value="Espalda">Espalda</option>
                <option value="Piernas">Piernas</option>
                <option value="Hombros">Hombros</option>
                <option value="Brazos">Brazos</option>
                <option value="Cardio">Cardio</option>
                <option value="Otro">Otro</option>
              </select>
              <button 
                onClick={handleCreateExercise}
                className="bg-spidey-blue hover:bg-blue-800 text-spidey-white px-4 rounded-xl transition-colors font-archivo text-sm uppercase"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <select 
              className="flex-1 bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue transition-colors font-work"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              <option value="">Selecciona un ejercicio...</option>
              {exercisesDB?.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <button 
              onClick={addExercise}
              className="bg-spidey-blue hover:bg-blue-800 text-spidey-white p-3 rounded-xl transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Lista de Ejercicios en el Workout actual */}
      {workoutExercises.map((ex, exIndex) => (
        <div key={exIndex} className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-archivo text-spidey-white uppercase">{ex.name}</h3>
            </div>
            <button onClick={() => removeExercise(exIndex)} className="text-spidey-red p-1">
              <Trash2 size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex text-[10px] font-archivo text-spidey-gray uppercase px-2">
              <div className="w-10 text-center">Set</div>
              <div className="flex-1 text-center">Kg</div>
              <div className="flex-1 text-center">Reps</div>
              <div className="w-12 text-center">✓</div>
            </div>
            
            {ex.sets.map((set, setIndex) => {
              const prev = ex.previousSets && ex.previousSets[setIndex];
              return (
                <div key={setIndex} className="flex flex-col gap-1 relative">
                  {prev && (
                    <div className="absolute -top-4 right-14 text-[10px] font-archivo text-spidey-amber uppercase bg-spidey-black px-2 py-0.5 rounded-t-lg border-t border-l border-r border-spidey-amber/30">
                      Anterior: {prev.weight}kg x {prev.reps}
                    </div>
                  )}
                  <div className={`flex gap-2 items-center p-2 rounded-xl transition-colors ${set.completed ? 'bg-spidey-amber/10 border border-spidey-amber/30' : ''}`}>
                    <div className="w-8 text-center font-bold text-spidey-white bg-spidey-gray/20 rounded-lg py-2 flex items-center justify-center">
                      {setIndex + 1}
                    </div>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={set.weight}
                      onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                      className="flex-1 bg-spidey-black border border-spidey-gray/50 rounded-xl p-2 text-center text-spidey-white focus:outline-none focus:border-spidey-blue font-work"
                    />
                    <input 
                      type="number" 
                      placeholder="0"
                      value={set.reps}
                      onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                      className="flex-1 bg-spidey-black border border-spidey-gray/50 rounded-xl p-2 text-center text-spidey-white focus:outline-none focus:border-spidey-blue font-work"
                    />
                    <button 
                      onClick={() => toggleSetCompletion(exIndex, setIndex)}
                      className={`w-10 flex justify-center items-center h-10 rounded-lg transition-colors ${set.completed ? 'bg-spidey-amber text-[#111112]' : 'bg-spidey-black border border-spidey-gray/50 text-spidey-gray hover:text-spidey-white'}`}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button onClick={() => removeSet(exIndex, setIndex)} className="w-8 flex justify-center text-spidey-gray hover:text-spidey-red transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button 
            onClick={() => addSet(exIndex)}
            className="w-full py-2 border-2 border-dashed border-spidey-gray/40 rounded-xl text-spidey-gray hover:text-spidey-white hover:border-spidey-white transition-colors font-archivo text-sm uppercase flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Añadir Serie
          </button>
        </div>
      ))}

      {/* Botón Guardar Rutina */}
      {workoutExercises.length > 0 && (
        <button 
          onClick={finishWorkout}
          className="w-full bg-spidey-amber hover:bg-yellow-500 text-[#111112] font-archivo uppercase py-4 px-4 rounded-2xl shadow-[0_4px_14px_0_rgba(242,169,0,0.39)] transition-colors tracking-wide flex justify-center items-center gap-2"
        >
          <Save size={20} /> FINALIZAR Y GUARDAR
        </button>
      )}
    </div>
  );
}
