import { useState, useEffect } from 'react';
import { X, RefreshCw, Plus, Flame, Beef, Wheat, Droplets, Check } from 'lucide-react';
import { foodDatabase, calcCalories } from '../data/foodDatabase';

export default function ChefModal({ isOpen, onClose, mealTarget, mealType, onLogMeal }) {
  const [suggestion, setSuggestion] = useState(null);

  const generateMeal = () => {
    const proteins = foodDatabase.filter(f => f.category === 'protein');
    const carbs = foodDatabase.filter(f => f.category === 'carbs');
    const fats = foodDatabase.filter(f => f.category === 'fats');

    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    let cart = [];

    // Protein
    if (mealTarget.protein > 0) {
      const pFood = rand(proteins);
      const needed = Math.round((mealTarget.protein * 100) / pFood.p);
      cart.push({ id: Date.now() + 1, food: pFood, grams: needed, providedMacro: mealTarget.protein });
    }

    // Carbs
    if (mealTarget.carbs > 0) {
      const cFood = rand(carbs);
      const needed = Math.round((mealTarget.carbs * 100) / cFood.c);
      cart.push({ id: Date.now() + 2, food: cFood, grams: needed, providedMacro: mealTarget.carbs });
    }

    // Fats
    if (mealTarget.fats > 0) {
      const fFood = rand(fats);
      const needed = Math.round((mealTarget.fats * 100) / fFood.f);
      cart.push({ id: Date.now() + 3, food: fFood, grams: needed, providedMacro: mealTarget.fats });
    }

    setSuggestion(cart);
  };

  useEffect(() => {
    if (isOpen) {
      generateMeal();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalCals = suggestion?.reduce((acc, item) => acc + Math.round((item.grams / 100) * calcCalories(item.food)), 0) || 0;
  const totalP = suggestion?.reduce((acc, item) => acc + (item.food.category === 'protein' ? item.providedMacro : 0), 0) || 0;
  const totalC = suggestion?.reduce((acc, item) => acc + (item.food.category === 'carbs' ? item.providedMacro : 0), 0) || 0;
  const totalF = suggestion?.reduce((acc, item) => acc + (item.food.category === 'fats' ? item.providedMacro : 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111112] w-full max-w-md border border-spidey-blue/30 rounded-3xl p-6 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-spidey-gray hover:text-spidey-white">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="text-4xl mb-2">👨‍🍳</div>
          <h3 className="text-2xl font-bebas text-spidey-blue tracking-wide text-center">Sugerencia del Chef</h3>
          <p className="text-sm font-work text-spidey-gray text-center mt-1">Para: {mealType}</p>
        </div>

        {mealTarget.protein <= 0 && mealTarget.carbs <= 0 && mealTarget.fats <= 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-green-500 mb-2">
              <Check size={48} />
            </div>
            <h4 className="text-xl font-bebas text-spidey-white">¡Misión Cumplida!</h4>
            <p className="text-spidey-gray font-work text-sm mt-2">Ya alcanzaste tu requerimiento de macros para esta comida. No necesitas más sugerencias.</p>
          </div>
        ) : suggestion && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="flex justify-between bg-spidey-gray/10 p-3 rounded-xl border border-spidey-gray/20">
              <div className="flex flex-col items-center">
                <Flame size={16} className="text-spidey-red mb-1" />
                <span className="text-xs font-archivo text-spidey-white">{totalCals} kcal</span>
              </div>
              <div className="flex flex-col items-center">
                <Beef size={16} className="text-spidey-blue mb-1" />
                <span className="text-xs font-archivo text-spidey-white">{totalP}g P</span>
              </div>
              <div className="flex flex-col items-center">
                <Wheat size={16} className="text-spidey-amber mb-1" />
                <span className="text-xs font-archivo text-spidey-white">{totalC}g C</span>
              </div>
              <div className="flex flex-col items-center">
                <Droplets size={16} className="text-spidey-gray mb-1" />
                <span className="text-xs font-archivo text-spidey-white">{totalF}g G</span>
              </div>
            </div>

            {/* Alimentos */}
            <div className="space-y-2">
              {suggestion.map(item => (
                <div key={item.id} className="bg-spidey-black border border-spidey-gray/30 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-work text-spidey-white text-sm">{item.food.name}</span>
                    <div className="text-xs text-spidey-gray mt-0.5">Aporta {item.providedMacro}g de macro</div>
                  </div>
                  <div className="bg-spidey-gray/20 px-3 py-1.5 rounded-lg">
                    <span className="font-bold text-spidey-white">{item.grams}g</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="pt-4 space-y-3">
              <button 
                onClick={generateMeal}
                className="w-full bg-transparent border border-spidey-blue text-spidey-blue font-archivo font-bold uppercase py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-spidey-blue/10 transition-colors"
              >
                <RefreshCw size={18} />
                Cambiar Platillo
              </button>
              <button 
                onClick={() => {
                  onLogMeal(suggestion);
                  onClose();
                }}
                className="w-full bg-spidey-blue text-white font-archivo font-bold uppercase py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Plus size={18} />
                Registrar Comida
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
