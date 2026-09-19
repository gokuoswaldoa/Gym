import { useState } from 'react';
import { Utensils, Flame, Beef, Wheat, Droplets, Plus, X } from 'lucide-react';

export default function Nutrition() {
  // Estado para consumos actuales
  const [consumed, setConsumed] = useState({
    calories: 1200,
    protein: 85,
    carbs: 150,
    fats: 30
  });

  // Metas nutricionales
  const goals = {
    calories: 2500,
    protein: 190,
    carbs: 280,
    fats: 60
  };

  // Platillos frecuentes (Registro Rápido)
  const quickMeals = [
    { id: 1, name: 'Desayuno Avena', calories: 350, protein: 15, carbs: 55, fats: 8 },
    { id: 2, name: 'Comida Pollo', calories: 600, protein: 50, carbs: 60, fats: 15 },
    { id: 3, name: 'Batido Whey', calories: 120, protein: 25, carbs: 3, fats: 1 },
    { id: 4, name: 'Cena Atún', calories: 400, protein: 35, carbs: 40, fats: 10 },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '' });

  // Función simulada para agregar comida
  const handleAddMeal = (meal) => {
    setConsumed(prev => ({
      calories: prev.calories + Number(meal.calories || 0),
      protein: prev.protein + Number(meal.protein || 0),
      carbs: prev.carbs + Number(meal.carbs || 0),
      fats: prev.fats + Number(meal.fats || 0)
    }));
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
              <strong className="text-spidey-white text-lg">{consumed.calories}</strong> / {goals.calories} kcal
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
              <span className="text-xs font-work text-spidey-gray"><strong className="text-spidey-white">{consumed.protein}g</strong> / {goals.protein}g</span>
            </div>
            <div className="w-full bg-spidey-black h-2 rounded-full overflow-hidden border border-spidey-gray/20">
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
              <span className="text-xs font-work text-spidey-gray"><strong className="text-spidey-white">{consumed.carbs}g</strong> / {goals.carbs}g</span>
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
              <span className="text-xs font-work text-spidey-gray"><strong className="text-spidey-white">{consumed.fats}g</strong> / {goals.fats}g</span>
            </div>
            <div className="w-full bg-spidey-black h-2 rounded-full overflow-hidden border border-spidey-gray/20">
              <div className="bg-spidey-gray h-full rounded-full transition-all duration-500" style={{ width: `${getPercentage(consumed.fats, goals.fats)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Registro Rápido */}
      <div className="space-y-3">
        <h3 className="text-lg font-archivo text-spidey-gray uppercase">Registro Rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickMeals.map(meal => (
            <button 
              key={meal.id}
              onClick={() => handleAddMeal(meal)}
              className="bg-spidey-gray/10 hover:bg-spidey-gray/20 border border-spidey-gray/20 p-3 rounded-xl text-left transition-colors flex flex-col justify-between"
            >
              <span className="font-archivo text-spidey-white text-sm mb-2">{meal.name}</span>
              <div className="text-[10px] font-work text-spidey-gray/80 space-y-0.5">
                <div><span className="text-spidey-red">🔥 {meal.calories} kcal</span></div>
                <div className="flex gap-2">
                  <span className="text-spidey-blue">P:{meal.protein}</span>
                  <span className="text-spidey-amber">C:{meal.carbs}</span>
                  <span>G:{meal.fats}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
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
                onClick={() => handleAddMeal(manualEntry)}
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
