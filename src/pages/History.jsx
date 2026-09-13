import { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';

export default function History() {
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').reverse().toArray());
  const sets = useLiveQuery(() => db.sets.toArray());
  const exercises = useLiveQuery(() => db.exercises.toArray());
  
  const [expandedId, setExpandedId] = useState(null);

  const getWorkoutDetails = (workoutId) => {
    if (!sets || !exercises) return [];
    const workoutSets = sets.filter(s => s.workoutId === workoutId);
    
    // Agrupar por ejercicio
    const grouped = {};
    workoutSets.forEach(s => {
      if (!grouped[s.exerciseId]) {
        const ex = exercises.find(e => e.id === s.exerciseId);
        grouped[s.exerciseId] = {
          name: ex ? ex.name : 'Desconocido',
          sets: []
        };
      }
      grouped[s.exerciseId].sets.push(s);
    });
    
    return Object.values(grouped);
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-3xl font-bebas text-spidey-amber tracking-wide">HISTORIAL</h2>
      
      {!workouts || workouts.length === 0 ? (
        <div className="text-spidey-gray text-center py-10 font-work">
          <p>Aún no has registrado entrenamientos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map(workout => (
            <div key={workout.id} className="bg-[#111112] rounded-2xl shadow-sm border border-spidey-gray/30 overflow-hidden">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer active:bg-spidey-gray/10"
                onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-spidey-blue/20 p-3 rounded-xl text-spidey-blue">
                    <Dumbbell size={24} />
                  </div>
                  <div>
                    <h3 className="font-archivo text-spidey-white uppercase">
                      {workout.type || 'Entrenamiento'}
                    </h3>
                    <p className="text-spidey-gray text-sm font-work capitalize">
                      {format(parseISO(workout.date), "EEEE, d 'de' MMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="text-spidey-gray">
                  {expandedId === workout.id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {expandedId === workout.id && (
                <div className="px-5 pb-5 pt-2 border-t border-spidey-gray/20 bg-[#0B0B0C]">
                  {getWorkoutDetails(workout.id).map((ex, idx) => (
                    <div key={idx} className="mb-4 last:mb-0">
                      <h4 className="font-archivo text-spidey-white text-sm uppercase mb-2 text-spidey-amber">{ex.name}</h4>
                      <div className="space-y-1">
                        {ex.sets.map((set, sIdx) => (
                          <div key={sIdx} className="flex text-sm font-work text-spidey-gray justify-between bg-spidey-gray/10 px-3 py-2 rounded-lg">
                            <span>Serie {sIdx + 1}</span>
                            <span className="font-bold text-spidey-white">{set.weight} kg <span className="text-spidey-gray font-normal mx-1">x</span> {set.reps} reps</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {getWorkoutDetails(workout.id).length === 0 && (
                    <p className="text-spidey-gray text-sm font-work">No hay series registradas.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
