import { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { foodDatabase, calcCalories } from '../data/foodDatabase';

export default function MealWizard({ isOpen, onClose, mealTarget, isPreWorkout, mealType, onLogMeal }) {
  const [step, setStep] = useState(0); // 0: protein, 1: carbs, 2: fats
  const [cart, setCart] = useState([]); // [{ food, grams, providedMacro }]

  // Limpiar el carrito cada vez que se abre el wizard
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setCart([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['protein', 'carbs', 'fats'];
  const currentCategory = categories[step];
  
  // Si es pre-entreno, saltar las grasas
  const skipFats = isPreWorkout && step === 2;

  const targetMap = {
    protein: mealTarget.protein,
    carbs: mealTarget.carbs,
    fats: mealTarget.fats
  };

  const currentTarget = targetMap[currentCategory];

  // Calcular cuánto llevamos del macro actual
  const currentAdded = cart
    .filter(item => item.food.category === currentCategory)
    .reduce((sum, item) => sum + item.providedMacro, 0);

  const remaining = Math.max(0, currentTarget - currentAdded);
  const isCompleted = remaining <= 0;

  // Filtrar alimentos
  let availableFoods = foodDatabase.filter(f => f.category === currentCategory);
  if (isPreWorkout && (currentCategory === 'protein' || currentCategory === 'carbs')) {
    availableFoods = availableFoods.filter(f => f.digestion !== 'slow');
  }

  const handleAddFood = (food) => {
    if (remaining <= 0) return; // Ya completó el macro

    // Qué macro aporta este alimento
    const macroPer100 = currentCategory === 'protein' ? food.p : currentCategory === 'carbs' ? food.c : food.f;
    if (macroPer100 <= 0) return;

    // Gramos necesarios para cumplir el remaining
    const neededGrams = Math.round((remaining * 100) / macroPer100);
    
    setCart([...cart, {
      id: Date.now() + Math.random(),
      food,
      grams: neededGrams,
      providedMacro: remaining
    }]);
  };

  const handleRemoveItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleUpdateGrams = (id, newGrams) => {
    // Permitir string vacío para que el usuario pueda borrar todo el número
    const val = newGrams === '' ? '' : Number(newGrams);
    
    setCart(cart.map(item => {
      if (item.id === id) {
        const macroPer100 = currentCategory === 'protein' ? item.food.p : currentCategory === 'carbs' ? item.food.c : item.food.f;
        const numForMath = val === '' ? 0 : val;
        const newProvided = (numForMath / 100) * macroPer100;
        return { ...item, grams: val, providedMacro: newProvided };
      }
      return item;
    }));
  };

  const nextStep = () => {
    if (step < 2) {
      if (isPreWorkout && step === 1) {
        // Saltar grasas si es pre-entreno
        finish();
      } else {
        setStep(step + 1);
      }
    } else {
      finish();
    }
  };

  const finish = () => {
    onLogMeal(cart);
  };

  // UI helpers
  const categoryNames = { protein: 'Proteínas', carbs: 'Carbohidratos', fats: 'Grasas' };
  const categoryColors = { protein: 'text-spidey-blue', carbs: 'text-spidey-amber', fats: 'text-spidey-gray' };
  const bgColors = { protein: 'bg-spidey-blue', carbs: 'bg-spidey-amber', fats: 'bg-spidey-gray' };

  return (
    <div className="fixed inset-0 bg-[#111112] z-50 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-spidey-gray/20">
        <div>
          <h2 className="text-2xl font-bebas text-spidey-white tracking-wide">Creador de Platillos</h2>
          <p className="text-sm font-work text-spidey-gray">Para: {mealType}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-spidey-gray/10 rounded-full text-spidey-gray hover:text-spidey-white">
          <X size={20} />
        </button>
      </div>

      {/* Progress Tabs */}
      <div className="flex px-5 py-3 gap-2">
        {['protein', 'carbs', 'fats'].map((cat, idx) => (
          <div key={cat} className={`flex-1 h-1.5 rounded-full ${idx <= step ? bgColors[cat] : 'bg-spidey-gray/20'} transition-all`}></div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="flex justify-between items-end mb-4">
          <h3 className={`text-xl font-archivo uppercase ${categoryColors[currentCategory]}`}>
            Paso {step + 1}: {categoryNames[currentCategory]}
          </h3>
          <span className="text-sm font-work text-spidey-white">
            Meta: <strong className={categoryColors[currentCategory]}>{currentTarget}g</strong>
          </span>
        </div>

        {/* Cart for current macro */}
        {cart.filter(item => item.food.category === currentCategory).length > 0 && (
          <div className="mb-6 space-y-2">
            <h4 className="text-xs font-archivo text-spidey-gray uppercase">Agregados:</h4>
            {cart.filter(item => item.food.category === currentCategory).map(item => (
              <div key={item.id} className="bg-spidey-gray/10 border border-spidey-gray/20 p-3 rounded-xl flex items-center gap-3">
                <div className="flex-1">
                  <span className="font-work text-sm text-spidey-white">{item.food.name}</span>
                  <div className="text-xs text-spidey-gray">Aporta: {Math.round(item.providedMacro)}g</div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={item.grams}
                    onChange={(e) => handleUpdateGrams(item.id, e.target.value)}
                    className="w-16 bg-spidey-black border border-spidey-gray/40 rounded-lg p-1.5 text-center text-spidey-white text-sm focus:outline-none focus:border-spidey-amber"
                  />
                  <span className="text-sm text-spidey-gray">g</span>
                </div>
                <button onClick={() => handleRemoveItem(item.id)} className="text-spidey-red p-2 bg-spidey-red/10 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            ))}
            
            <div className={`p-3 rounded-xl flex justify-between items-center ${isCompleted ? 'bg-green-500/10 border border-green-500/20' : 'bg-spidey-gray/5 border border-spidey-gray/10'}`}>
              <span className="text-sm font-work text-spidey-gray">Faltan:</span>
              <span className={`text-lg font-bold ${isCompleted ? 'text-green-500' : 'text-spidey-white'}`}>
                {Math.round(remaining)}g
              </span>
            </div>
          </div>
        )}

        {/* Food List */}
        {!isCompleted ? (
          <div>
            <h4 className="text-xs font-archivo text-spidey-gray uppercase mb-3">
              {cart.filter(item => item.food.category === currentCategory).length > 0 
                ? 'Agrega otro alimento para completar:' 
                : 'Selecciona una opción:'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {availableFoods.map(food => (
                <button 
                  key={food.id}
                  onClick={() => handleAddFood(food)}
                  className="bg-spidey-black border border-spidey-gray/20 p-3 rounded-xl text-left hover:border-spidey-amber transition-colors flex flex-col justify-between h-24"
                >
                  <span className="font-work text-sm text-spidey-white line-clamp-2 leading-tight">{food.name}</span>
                  <span className="text-[10px] font-archivo text-spidey-gray uppercase mt-2">
                    +{currentCategory === 'protein' ? food.p : currentCategory === 'carbs' ? food.c : food.f}g por 100g
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-80">
            <div className="bg-green-500/20 text-green-500 p-4 rounded-full mb-4">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-xl font-bebas text-spidey-white tracking-wide">¡MACRO COMPLETADO!</h3>
            <p className="text-sm font-work text-spidey-gray text-center mt-2">
              Haz clic en Siguiente para continuar.
            </p>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#111112] border-t border-spidey-gray/20 flex flex-col gap-3">
        {isPreWorkout && step === 1 && (
          <div className="bg-spidey-red/10 border border-spidey-red/20 p-2 rounded-lg text-center">
            <p className="text-xs font-work text-spidey-red">⚡ Pre-Entreno: Las grasas se saltarán para digestión rápida.</p>
          </div>
        )}
        <div className="flex gap-3">
          {step > 0 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-4 py-4 bg-spidey-gray/10 text-spidey-white rounded-xl flex items-center justify-center hover:bg-spidey-gray/20 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <button 
            onClick={nextStep}
            className="flex-1 bg-spidey-amber text-[#111112] font-archivo font-bold uppercase py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-yellow-500 transition-transform active:scale-95"
          >
            {step === 2 || (isPreWorkout && step === 1) ? 'Finalizar y Guardar' : 'Siguiente'}
            {step === 2 || (isPreWorkout && step === 1) ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
