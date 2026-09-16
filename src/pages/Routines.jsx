import { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, CalendarDays } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' }
];

export default function Routines() {
  const plannedRoutines = useLiveQuery(() => db.plannedRoutines.toArray());
  const exercisesDB = useLiveQuery(() => db.exercises.toArray());
  
  const [showForm, setShowForm] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState('');

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const addExercise = () => {
    if (!currentExercise) return;
    setSelectedExercises([...selectedExercises, Number(currentExercise)]);
    setCurrentExercise('');
  };

  const removeExercise = (index) => {
    const updated = [...selectedExercises];
    updated.splice(index, 1);
    setSelectedExercises(updated);
  };

  const saveRoutine = async () => {
    if (!newRoutineName || selectedDays.length === 0 || selectedExercises.length === 0) return;
    
    await db.plannedRoutines.add({
      name: newRoutineName,
      days: selectedDays,
      exercises: selectedExercises
    });
    
    import('../lib/sync').then(({ triggerSync }) => triggerSync());
    
    setShowForm(false);
    setNewRoutineName('');
    setSelectedDays([]);
    setSelectedExercises([]);
  };

  const deleteRoutine = async (id) => {
    await db.plannedRoutines.delete(id);
    import('../lib/sync').then(({ triggerSync }) => triggerSync());
  };

  const getExerciseName = (id) => {
    return exercisesDB?.find(e => e.id === id)?.name || 'Desconocido';
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bebas text-spidey-amber tracking-wide">PLANTILLAS</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-spidey-amber text-[#111112] px-4 py-2 rounded-xl font-archivo text-sm uppercase font-bold flex items-center gap-2"
        >
          {showForm ? 'Cancelar' : <><Plus size={18} /> Nueva</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-amber/50 space-y-5">
          <input 
            type="text"
            placeholder="Nombre (ej. Pecho y Tríceps)"
            value={newRoutineName}
            onChange={(e) => setNewRoutineName(e.target.value)}
            className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue font-work"
          />

          <div>
            <label className="block text-xs font-archivo text-spidey-gray uppercase mb-2">Días de la semana</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`px-3 py-1.5 rounded-lg font-work text-sm transition-colors ${selectedDays.includes(day.id) ? 'bg-spidey-blue text-white' : 'bg-spidey-gray/20 text-spidey-gray hover:text-white'}`}
                >
                  {day.name.substring(0,3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-archivo text-spidey-gray uppercase mb-2">Ejercicios</label>
            <div className="flex gap-2 mb-3">
              <select 
                className="flex-1 bg-spidey-black border border-spidey-gray/50 rounded-xl p-2 text-spidey-white focus:outline-none focus:border-spidey-blue font-work"
                value={currentExercise}
                onChange={(e) => setCurrentExercise(e.target.value)}
              >
                <option value="">Selecciona...</option>
                {exercisesDB?.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <button 
                onClick={addExercise}
                className="bg-spidey-gray/20 text-spidey-white p-2 rounded-xl hover:bg-spidey-blue transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              {selectedExercises.map((exId, idx) => (
                <div key={idx} className="flex justify-between items-center bg-spidey-gray/10 p-2 rounded-lg border border-spidey-gray/20">
                  <span className="text-sm font-work text-spidey-white">{idx + 1}. {getExerciseName(exId)}</span>
                  <button onClick={() => removeExercise(idx)} className="text-spidey-red p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={saveRoutine}
            className="w-full bg-spidey-blue hover:bg-blue-800 text-spidey-white font-archivo uppercase py-3 rounded-xl transition-colors tracking-wide"
          >
            Guardar Plantilla
          </button>
        </div>
      )}

      <div className="space-y-4">
        {plannedRoutines?.length === 0 && !showForm && (
          <div className="text-center p-10 bg-spidey-gray/10 rounded-2xl border border-dashed border-spidey-gray/30">
            <CalendarDays size={48} className="mx-auto text-spidey-gray/50 mb-3" />
            <p className="text-spidey-gray font-work">Aún no tienes rutinas programadas.</p>
          </div>
        )}

        {plannedRoutines?.map(routine => (
          <div key={routine.id} className="bg-[#111112] p-4 rounded-2xl shadow-sm border border-spidey-gray/30 relative">
            <button 
              onClick={() => deleteRoutine(routine.id)}
              className="absolute top-4 right-4 text-spidey-gray hover:text-spidey-red transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <h3 className="text-xl font-archivo text-spidey-white uppercase mb-2">{routine.name}</h3>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {routine.days.map(dId => (
                <span key={dId} className="text-[10px] uppercase font-archivo bg-spidey-blue/20 text-spidey-blue px-2 py-0.5 rounded-full border border-spidey-blue/30">
                  {DAYS_OF_WEEK.find(d => d.id === dId)?.name}
                </span>
              ))}
            </div>
            
            <div className="text-sm font-work text-spidey-gray">
              {routine.exercises.length} Ejercicios:
              <p className="mt-1 text-spidey-white/80 line-clamp-2">
                {routine.exercises.map(exId => getExerciseName(exId)).join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
