import { useState, useMemo } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Progress() {
  const [filter, setFilter] = useState('all'); // '7days', '30days', 'all'
  const [metric, setMetric] = useState('bodyWeight'); // 'bodyWeight' or exerciseId

  const rawWeightData = useLiveQuery(() => db.bodyWeightLogs.orderBy('date').toArray());
  const exercises = useLiveQuery(() => db.exercises.toArray());
  const sets = useLiveQuery(() => db.sets.toArray());
  const workouts = useLiveQuery(() => db.workouts.toArray());

  const chartData = useMemo(() => {
    const now = new Date();
    let cutoff = null;
    if (filter === '7days') cutoff = subDays(now, 7);
    if (filter === '30days') cutoff = subDays(now, 30);

    if (metric === 'bodyWeight') {
      if (!rawWeightData) return [];
      const filtered = cutoff 
        ? rawWeightData.filter(log => isAfter(parseISO(log.date), cutoff))
        : rawWeightData;

      return filtered.map(log => ({
        name: format(parseISO(log.date), 'dd MMM', { locale: es }),
        peso: log.weight,
        fullDate: log.date
      }));
    } else {
      if (!sets || !workouts) return [];
      const exerciseId = Number(metric);
      const exSets = sets.filter(s => s.exerciseId === exerciseId);
      
      // Agrupar por workoutId y calcular el 1RM máximo del día
      const groupedByWorkout = {};
      exSets.forEach(s => {
        if (!groupedByWorkout[s.workoutId]) {
          groupedByWorkout[s.workoutId] = { max1RM: 0, weight: 0, reps: 0 };
        }
        
        // Fórmula Brzycki: Peso * (36 / (37 - Reps))
        // Limitamos las repeticiones a 36 para evitar división por cero o números negativos
        const safeReps = Math.min(s.reps, 36);
        const estimated1RM = s.weight * (36 / (37 - safeReps));
        
        if (estimated1RM > groupedByWorkout[s.workoutId].max1RM) {
          groupedByWorkout[s.workoutId].max1RM = estimated1RM;
          groupedByWorkout[s.workoutId].weight = s.weight;
          groupedByWorkout[s.workoutId].reps = s.reps;
        }
      });

      // Mapear a fechas
      const data = [];
      Object.keys(groupedByWorkout).forEach(wId => {
        const w = workouts.find(w => w.id === Number(wId));
        if (w) {
          if (!cutoff || isAfter(parseISO(w.date), cutoff)) {
            data.push({
              name: format(parseISO(w.date), 'dd MMM', { locale: es }),
              peso: Math.round(groupedByWorkout[wId].max1RM * 10) / 10, // 1RM redondeado
              realWeight: groupedByWorkout[wId].weight,
              reps: groupedByWorkout[wId].reps,
              fullDate: w.date
            });
          }
        }
      });

      // Ordenar por fecha
      return data.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    }
  }, [metric, filter, rawWeightData, exercises, sets, workouts]);

  const metricName = metric === 'bodyWeight' 
    ? 'Peso Corporal (Kg)' 
    : (exercises?.find(e => e.id === Number(metric))?.name + ' (Kg Máx)' || 'Ejercicio');

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-3xl font-bebas text-spidey-amber tracking-wide">PROGRESO</h2>
      
      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30">
        
        <div className="flex flex-col gap-4 mb-6">
          <select 
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue text-sm font-work"
          >
            <option value="bodyWeight">Peso Corporal</option>
            <optgroup label="Ejercicios">
              {exercises?.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </optgroup>
          </select>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-archivo text-spidey-white uppercase">{metricName}</h3>
            
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-spidey-black border border-spidey-gray/50 rounded-lg p-1 text-spidey-white focus:outline-none focus:border-spidey-blue text-sm font-work"
            >
              <option value="7days">7 días</option>
              <option value="30days">30 días</option>
              <option value="all">Todo</option>
            </select>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5C5C60" strokeOpacity={0.4} />
                <XAxis dataKey="name" stroke="#F2F1EC" fontSize={12} fontFamily="'Work Sans', sans-serif" />
                <YAxis stroke="#F2F1EC" fontSize={12} fontFamily="'Work Sans', sans-serif" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0B0C', border: '1px solid #5C5C60', borderRadius: '12px', color: '#F2F1EC', fontFamily: "'Work Sans', sans-serif" }}
                  itemStyle={{ color: '#E1251B' }}
                  labelStyle={{ color: '#F2A900' }}
                  formatter={(value, name, props) => {
                    if(metric !== 'bodyWeight') return [`${value} kg (Real: ${props.payload.realWeight}kg x${props.payload.reps})`, '1RM Est.'];
                    return [`${value} kg`, 'Peso'];
                  }}
                />
                <Line type="monotone" dataKey="peso" stroke="#E1251B" strokeWidth={4} dot={{ r: 5, fill: '#1B3A8A', strokeWidth: 2, stroke: '#F2F1EC' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full flex items-center justify-center text-spidey-gray font-work text-sm text-center bg-spidey-gray/5 rounded-xl border border-dashed border-spidey-gray/20">
            Aún no hay suficientes datos registrados para generar la gráfica.
          </div>
        )}
      </div>
    </div>
  );
}
