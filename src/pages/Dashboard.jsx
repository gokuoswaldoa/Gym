import { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [weight, setWeight] = useState('');
  
  const lastWeight = useLiveQuery(
    () => db.bodyWeightLogs.orderBy('date').last()
  );

  const saveWeight = async () => {
    if (!weight) return;
    await db.bodyWeightLogs.add({
      date: new Date().toISOString(),
      weight: parseFloat(weight)
    });
    setWeight('');
    
    // Disparar sincronización
    import('../lib/sync').then(({ triggerSync }) => triggerSync());
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bebas text-spidey-amber tracking-wide">RESUMEN</h2>
      
      {/* Tarjeta de Peso Corporal */}
      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30">
        <h3 className="text-lg font-archivo mb-2 text-spidey-white">Peso Corporal</h3>
        {lastWeight ? (
          <p className="text-spidey-gray text-sm mb-4">Último registro: <span className="text-spidey-white font-bold">{lastWeight.weight} kg</span></p>
        ) : (
          <p className="text-spidey-gray text-sm mb-4">No has registrado tu peso.</p>
        )}
        <div className="flex gap-2">
          <input 
            type="number" 
            step="0.1"
            placeholder="Ej. 75.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="flex-1 bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue font-work"
          />
          <button 
            onClick={saveWeight}
            className="bg-spidey-blue hover:bg-blue-800 text-spidey-white font-archivo uppercase px-4 rounded-xl transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Tarjeta de Último Entrenamiento */}
      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30">
        <h3 className="text-lg font-archivo mb-2 text-spidey-white">Último entrenamiento</h3>
        <p className="text-spidey-gray text-sm">No hay entrenamientos recientes.</p>
      </div>
      
      <button 
        onClick={() => navigate('/workout')}
        className="w-full bg-spidey-red hover:bg-red-700 text-spidey-white font-archivo uppercase py-4 px-4 rounded-2xl shadow-[0_4px_14px_0_rgba(225,37,27,0.39)] transition-colors tracking-wide"
      >
        EMPEZAR NUEVA RUTINA
      </button>
    </div>
  );
}
