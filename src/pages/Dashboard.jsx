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
      <div className="flex flex-col items-center justify-center pt-4 pb-2">
        <h1 className="text-4xl font-bebas text-spidey-white tracking-widest">SPIDER<span className="text-spidey-red">FIT</span></h1>
        <p className="text-spidey-gray font-archivo text-sm uppercase tracking-widest mt-1">Selecciona un módulo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Módulo Entrenamiento */}
        <button 
          onClick={() => navigate('/workout')}
          className="relative overflow-hidden bg-[#111112] border border-spidey-red/50 rounded-3xl p-6 text-left flex flex-col items-start gap-4 shadow-[0_4px_20px_rgba(225,37,27,0.15)] hover:bg-spidey-red/10 transition-colors"
        >
          <div className="bg-spidey-red/20 p-3 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-spidey-red"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bebas text-spidey-white tracking-wide">ENTRENAMIENTO</h2>
            <p className="text-spidey-gray font-work text-sm mt-1">Registra tus rutinas, pesos y tiempos de descanso.</p>
          </div>
        </button>

        {/* Módulo Nutrición */}
        <button 
          onClick={() => navigate('/nutrition')}
          className="relative overflow-hidden bg-[#111112] border border-spidey-amber/50 rounded-3xl p-6 text-left flex flex-col items-start gap-4 shadow-[0_4px_20px_rgba(242,169,0,0.15)] hover:bg-spidey-amber/10 transition-colors"
        >
          <div className="bg-spidey-amber/20 p-3 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-spidey-amber"><path d="M12 2v20"/><path d="M18.5 6.5 5.5 19.5"/><path d="M5.5 6.5 18.5 19.5"/><path d="M2 12h20"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bebas text-spidey-white tracking-wide">NUTRICIÓN</h2>
            <p className="text-spidey-gray font-work text-sm mt-1">Arma tus comidas y cumple tus macros diarios.</p>
          </div>
        </button>
      </div>

      {/* Tarjeta de Peso Corporal */}
      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30 mt-4">
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
    </div>
  );
}
