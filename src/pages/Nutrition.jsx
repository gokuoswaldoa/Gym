import { useState, useEffect } from 'react';
import { Flame, Beef, Wheat, Droplets, Plus, X } from 'lucide-react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { calcCalories } from '../data/foodDatabase';
import MealWizard from '../components/MealWizard';

export default function Nutrition() {
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '' });

  const goals = { calories: 2500, protein: 190, carbs: 280, fats: 60 };
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

  const mealTarget = {
    protein: Math.round(remaining.protein / remainingMeals),
    carbs: Math.round(remaining.carbs / remainingMeals),
    fats: isPreWorkout ? 0 : Math.round(remaining.fats / remainingMeals)
  };

  const handleLogSmartMeal = async (cart) => {
    setIsWizardOpen(false);
    if (cart.length === 0) return;

    let mealCals = 0;
    let mealP = 0;
    let mealC = 0;
    let mealF = 0;
    const foodStrings = [];

    cart.forEach(item => {
      const p = item.food.category === 'protein' ? item.providedMacro : 0;
      const c = item.food.category === 'carbs' ? item.providedMacro : 0;
      const f = item.food.category === 'fats' ? item.providedMacro : 0;
      const cals = Math.round((item.grams / 100) * calcCalories(item.food));

      mealP += p;
      mealC += c;
      mealF += f;
      mealCals += cals;
      foodStrings.push(`${item.grams}g ${item.food.name}`);
    });

    await db.nutritionLogs.add({
      date: todayStr,
      mealType: mealType,
      calories: mealCals,
      protein: Math.round(mealP),
      carbs: Math.round(mealC),
      fats: Math.round(mealF),
      foods: foodStrings
    });
    import('../lib/sync').then(({ triggerSync }) => triggerSync());
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

      {/* Botón Lanzar Wizard */}
      <div className="bg-[#111112] p-6 rounded-3xl shadow-sm border border-spidey-amber/30 space-y-4 flex flex-col items-center text-center">
        <h3 className="text-2xl font-bebas text-spidey-amber tracking-wide">ARMA TU PLATILLO</h3>
        <p className="text-sm font-work text-spidey-gray">
          Asistente inteligente para calcular tus gramos de comida según la hora del día y lo que te falta por consumir.
        </p>
        <button 
          onClick={() => setIsWizardOpen(true)}
          className="w-full bg-spidey-amber text-[#111112] font-archivo font-bold uppercase py-4 rounded-xl hover:bg-yellow-500 transition-transform active:scale-95 shadow-[0_4px_20px_rgba(242,169,0,0.3)] mt-2"
        >
          ✨ Iniciar Creador
        </button>
      </div>

      <MealWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        mealTarget={mealTarget} 
        isPreWorkout={isPreWorkout} 
        mealType={mealType} 
        onLogMeal={handleLogSmartMeal} 
      />

      {/* FAB - Agregar Manual */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-spidey-gray/20 border border-spidey-gray/30 text-spidey-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-spidey-gray/30 transition-transform active:scale-95 z-40"
      >
        <Plus size={24} />
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
            
            <h3 className="text-2xl font-bebas text-spidey-white tracking-wide mb-6">Agregar Alimento Manual</h3>
            
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
                className="w-full bg-spidey-gray/20 text-spidey-white font-archivo font-bold uppercase py-4 rounded-xl mt-4 hover:bg-spidey-gray/30 transition-colors"
              >
                Añadir al registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Secreto para Resetear (Testing) */}
      <div className="flex justify-center mt-12 mb-8">
        <button 
          onClick={async () => {
            const pwd = prompt('Contraseña de administrador:');
            if (pwd === '123') {
              const todayStr = new Date().toISOString().split('T')[0];
              await db.nutritionLogs.where({ date: todayStr }).delete();
              import('../lib/sync').then(({ triggerSync }) => triggerSync());
              alert('Macros de hoy borrados.');
            } else {
              alert('Contraseña incorrecta');
            }
          }}
          className="text-[10px] text-spidey-gray/30 hover:text-spidey-red/50 uppercase font-archivo"
        >
          Reset
        </button>
      </div>

    </div>
  );
}
