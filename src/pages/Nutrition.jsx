import { useState, useEffect, useMemo } from 'react';
import { Utensils, Flame, Beef, Wheat, Droplets, Plus, X, CheckCircle2 } from 'lucide-react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { foodDatabase, calcCalories } from '../data/foodDatabase';

export default function Nutrition() {
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '' });

  // Metas nutricionales del usuario
  const goals = { calories: 2500, protein: 190, carbs: 280, fats: 60 };

  // Cargar registros del día actual
  const todayStr = new Date().toISOString().split('T')[0];
  const logs = useLiveQuery(() => db.nutritionLogs.where({ date: todayStr }).toArray(), [todayStr]);

  useEffect(() => {
    if (logs) {
      const totals = logs.reduce((acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fats += log.fats || 0;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
      setConsumed(totals);
    }
  }, [logs]);

  const remaining = {
    protein: Math.max(0, goals.protein - consumed.protein),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fats: Math.max(0, goals.fats - consumed.fats)
  };

  // Lógica de Ventanas de Comida
  const currentHour = new Date().getHours();
  let mealType = 'Desayuno';
  let remainingMeals = 4;
  let isPreWorkout = false;

  if (currentHour < 9) {
    mealType = 'Desayuno';
    remainingMeals = 4;
  } else if (currentHour < 15) {
    mealType = 'Comida (Universidad)';
    remainingMeals = 3;
  } else if (currentHour < 18) {
    mealType = 'Pre-Entreno';
    remainingMeals = 2;
    isPreWorkout = true;
  } else {
    mealType = 'Cena / Post-Entreno';
    remainingMeals = 1;
  }

  // Targets para la comida actual
  const mealTarget = {
    protein: Math.round(remaining.protein / remainingMeals),
    carbs: Math.round(remaining.carbs / remainingMeals),
    fats: isPreWorkout ? 0 : Math.round(remaining.fats / remainingMeals)
  };

  // Estados del Menú Inteligente
  const [selectedProteinId, setSelectedProteinId] = useState('');
  const [selectedCarbId, setSelectedCarbId] = useState('');
  const [selectedFatId, setSelectedFatId] = useState('');

  // Cálculos dinámicos
  const selectedProtein = foodDatabase.find(f => f.id === selectedProteinId);
  const selectedCarb = foodDatabase.find(f => f.id === selectedCarbId);
  const selectedFat = foodDatabase.find(f => f.id === selectedFatId);

  // Regla de 3 para calcular gramos en crudo
  // Si necesito 40g de prote y el alimento tiene 23g por cada 100g -> (40 * 100) / 23 = 174g
  const calcGrams = (target, foodMacroPer100) => {
    if (!foodMacroPer100 || target <= 0) return 0;
    return Math.round((target * 100) / foodMacroPer100);
  };

  const pGrams = selectedProtein ? calcGrams(mealTarget.protein, selectedProtein.p) : 0;
  const cGrams = selectedCarb ? calcGrams(mealTarget.carbs, selectedCarb.c) : 0;
  const fGrams = selectedFat ? calcGrams(mealTarget.fats, selectedFat.f) : 0;

  const totalMealCals = Math.round(
    ((pGrams/100) * (selectedProtein ? calcCalories(selectedProtein) : 0)) +
    ((cGrams/100) * (selectedCarb ? calcCalories(selectedCarb) : 0)) +
    ((fGrams/100) * (selectedFat ? calcCalories(selectedFat) : 0))
  );

  const handleLogSmartMeal = async () => {
    const mealCals = totalMealCals;
    const mealP = mealTarget.protein;
    const mealC = mealTarget.carbs;
    const mealF = mealTarget.fats;

    if (mealCals > 0) {
      await db.nutritionLogs.add({
        date: todayStr,
        mealType: mealType,
        calories: mealCals,
        protein: mealP,
        carbs: mealC,
        fats: mealF,
        foods: [
          selectedProtein ? `${pGrams}g ${selectedProtein.name}` : null,
          selectedCarb ? `${cGrams}g ${selectedCarb.name}` : null,
          selectedFat ? `${fGrams}g ${selectedFat.name}` : null
        ].filter(Boolean)
      });
      import('../lib/sync').then(({ triggerSync }) => triggerSync());
      
      setSelectedProteinId('');
      setSelectedCarbId('');
      setSelectedFatId('');
    }
  };

  const handleAddManual = async () => {
    await db.nutritionLogs.add({
      date: todayStr,
      mealType: 'Manual',
      calories: Number(manualEntry.calories) || 0,
      protein: Number(manualEntry.protein) || 0,
      carbs: Number(manualEntry.carbs) || 0,
      fats: Number(manualEntry.fats) || 0,
      foods: [manualEntry.name || 'Registro Manual']
    });
    import('../lib/sync').then(({ triggerSync }) => triggerSync());
    setIsModalOpen(false);
    setManualEntry({ name: '', calories: '', protein: '', carbs: '', fats: '' });
  };

  const getPercentage = (current, goal) => Math.min(100, Math.round((current / goal) * 100));

  // Filtrado de alimentos según la hora
  const availableProteins = foodDatabase.filter(f => f.category === 'protein' && (!isPreWorkout || f.digestion !== 'slow'));
  const availableCarbs = foodDatabase.filter(f => f.category === 'carbs' && (!isPreWorkout || f.digestion !== 'slow'));
  const availableFats = foodDatabase.filter(f => f.category === 'fats');

  return (
    <div className="space-y-6 pb-24 relative min-h-[85vh]">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bebas text-spidey-amber tracking-wide">NUTRICIÓN</h2>
      </div>

      {/* Panel Superior: Barras de Progreso */}
      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30 space-y-5">
        
        {/* Calorías Totales */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-spidey-red" />
              <span className="font-archivo text-spidey-white uppercase">Calorías</span>
            </div>
            <span className="font-work text-sm text-spidey-gray">
              <strong className="text-spidey-white text-lg">{Math.round(consumed.calories)}</strong> / {goals.calories} kcal
            </span>
          </div>
          <div className="w-full bg-spidey-black h-3 rounded-full overflow-hidden border border-spidey-gray/20">
            <div 
              className="bg-spidey-red h-full rounded-full transition-all duration-500"
              style={{ width: `${getPercentage(consumed.calories, goals.calories)}%` }}
            ></div>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          {/* Proteína */}
          <div className="space-y-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-spidey-blue mb-1">
                <Beef size={14} />
                <span className="text-xs font-archivo uppercase">Proteína</span>
              </div>
              <span className="text-xs font-work text-spidey-gray"><strong className="text-spidey-white">{Math.round(consumed.protein)}g</strong> / {goals.protein}g</span>
            </div>
            <div className="w-full bg-spidey-black h-2 rounded-full overflow-hidden border border-spidey-gray/20 relative">
              <div className="bg-spidey-blue h-full rounded-full transition-all duration-500" style={{ width: `${getPercentage(consumed.protein, goals.protein)}%` }}></div>
            </div>
          </div>

          {/* Carbohidratos */}
          <div className="space-y-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-spidey-amber mb-1">
                <Wheat size={14} />
                <span className="text-xs font-archivo uppercase">Carbos</span>
              </div>
              <span className="text-xs font-work text-spidey-gray"><strong className="text-spidey-white">{Math.round(consumed.carbs)}g</strong> / {goals.carbs}g</span>
            </div>
            <div className="w-full bg-spidey-black h-2 rounded-full overflow-hidden border border-spidey-gray/20">
              <div className="bg-spidey-amber h-full rounded-full transition-all duration-500" style={{ width: `${getPercentage(consumed.carbs, goals.carbs)}%` }}></div>
            </div>
          </div>

          {/* Grasas */}
          <div className="space-y-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-spidey-gray mb-1">
                <Droplets size={14} />
                <span className="text-xs font-archivo uppercase">Grasas</span>
              </div>
              <span className="text-xs font-work text-spidey-gray"><strong className="text-spidey-white">{Math.round(consumed.fats)}g</strong> / {goals.fats}g</span>
            </div>
            <div className="w-full bg-spidey-black h-2 rounded-full overflow-hidden border border-spidey-gray/20">
              <div className="bg-spidey-gray h-full rounded-full transition-all duration-500" style={{ width: `${getPercentage(consumed.fats, goals.fats)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Menú Inteligente */}
      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-amber/30 space-y-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-archivo text-spidey-amber uppercase tracking-wide">Arma tu Platillo</h3>
            <p className="text-sm font-work text-spidey-gray mt-1">Sugerencias para: <strong className="text-spidey-white">{mealType}</strong></p>
          </div>
          {isPreWorkout && (
            <span className="bg-spidey-red/20 text-spidey-red text-[10px] font-archivo uppercase px-2 py-1 rounded-lg border border-spidey-red/30">
              Digestión Rápida
            </span>
          )}
        </div>

        <div className="space-y-4 mt-4">
          {/* Selector Proteína */}
          {remaining.protein > 0 ? (
            <div className="space-y-1">
              <label className="text-xs font-archivo text-spidey-blue uppercase flex justify-between">
                <span>Elige Proteína</span>
                <span>Meta: {mealTarget.protein}g</span>
              </label>
              <select 
                className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue text-sm"
                value={selectedProteinId}
                onChange={e => setSelectedProteinId(e.target.value)}
              >
                <option value="">Selecciona una proteína...</option>
                {availableProteins.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              {selectedProtein && (
                <p className="text-xs font-work text-spidey-white mt-1">
                  👉 Pesa <strong className="text-spidey-blue text-base">{pGrams}g</strong> en crudo.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
              <CheckCircle2 size={18} />
              <span className="font-archivo text-sm uppercase">¡Proteína Completada!</span>
            </div>
          )}

          {/* Selector Carbohidratos */}
          {remaining.carbs > 0 ? (
            <div className="space-y-1">
              <label className="text-xs font-archivo text-spidey-amber uppercase flex justify-between">
                <span>Elige Carbohidrato</span>
                <span>Meta: {mealTarget.carbs}g</span>
              </label>
              <select 
                className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-amber text-sm"
                value={selectedCarbId}
                onChange={e => setSelectedCarbId(e.target.value)}
              >
                <option value="">Selecciona un carbohidrato...</option>
                {availableCarbs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              {selectedCarb && (
                <p className="text-xs font-work text-spidey-white mt-1">
                  👉 Pesa <strong className="text-spidey-amber text-base">{cGrams}g</strong> en crudo.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
              <CheckCircle2 size={18} />
              <span className="font-archivo text-sm uppercase">¡Carbos Completados!</span>
            </div>
          )}

          {/* Selector Grasas */}
          {remaining.fats > 0 ? (
            isPreWorkout ? (
              <div className="p-3 bg-spidey-gray/10 rounded-xl border border-spidey-gray/20">
                <p className="text-xs font-work text-spidey-gray text-center">Evita grasas antes de entrenar para una digestión rápida. Las guardaremos para la cena.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-archivo text-spidey-gray uppercase flex justify-between">
                  <span>Elige Grasa</span>
                  <span>Meta: {mealTarget.fats}g</span>
                </label>
                <select 
                  className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-gray text-sm"
                  value={selectedFatId}
                  onChange={e => setSelectedFatId(e.target.value)}
                >
                  <option value="">Selecciona una grasa...</option>
                  {availableFats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {selectedFat && (
                  <p className="text-xs font-work text-spidey-white mt-1">
                    👉 Pesa <strong className="text-spidey-gray text-base">{fGrams}g</strong> en crudo.
                  </p>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
              <CheckCircle2 size={18} />
              <span className="font-archivo text-sm uppercase">¡Grasas Completadas!</span>
            </div>
          )}
        </div>

        <button 
          onClick={handleLogSmartMeal}
          disabled={!selectedProteinId && !selectedCarbId && !selectedFatId}
          className="w-full bg-spidey-amber text-[#111112] font-archivo font-bold uppercase py-4 rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          Registrar {totalMealCals > 0 ? `(~${totalMealCals} kcal)` : ''}
        </button>
      </div>

      {/* FAB - Agregar Manual */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-spidey-amber text-[#111112] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(242,169,0,0.4)] hover:bg-yellow-500 transition-transform active:scale-95 z-40"
      >
        <Plus size={28} />
      </button>

      {/* Modal - Ingreso Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111112] w-full max-w-md border border-spidey-gray/30 rounded-3xl p-6 relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-spidey-gray hover:text-spidey-white"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-2xl font-bebas text-spidey-white tracking-wide mb-6">Agregar Alimento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-archivo text-spidey-gray uppercase mb-1">Nombre (Opcional)</label>
                <input 
                  type="text" 
                  value={manualEntry.name}
                  onChange={e => setManualEntry({...manualEntry, name: e.target.value})}
                  className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-amber"
                  placeholder="Ej. Manzana"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-archivo text-spidey-red uppercase mb-1">Calorías (kcal)</label>
                  <input 
                    type="number" 
                    value={manualEntry.calories}
                    onChange={e => setManualEntry({...manualEntry, calories: e.target.value})}
                    className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-red"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-archivo text-spidey-blue uppercase mb-1">Proteína (g)</label>
                  <input 
                    type="number" 
                    value={manualEntry.protein}
                    onChange={e => setManualEntry({...manualEntry, protein: e.target.value})}
                    className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-blue"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-archivo text-spidey-amber uppercase mb-1">Carbohidratos (g)</label>
                  <input 
                    type="number" 
                    value={manualEntry.carbs}
                    onChange={e => setManualEntry({...manualEntry, carbs: e.target.value})}
                    className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-amber"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-archivo text-spidey-gray uppercase mb-1">Grasas (g)</label>
                  <input 
                    type="number" 
                    value={manualEntry.fats}
                    onChange={e => setManualEntry({...manualEntry, fats: e.target.value})}
                    className="w-full bg-spidey-black border border-spidey-gray/50 rounded-xl p-3 text-spidey-white focus:outline-none focus:border-spidey-gray"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleAddManual}
                className="w-full bg-spidey-amber text-[#111112] font-archivo font-bold uppercase py-4 rounded-xl mt-4 hover:bg-yellow-500 transition-colors"
              >
                Añadir al registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
