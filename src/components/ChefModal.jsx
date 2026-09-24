import { useState, useEffect } from 'react';
import { X, RefreshCw, Plus, Flame, Beef, Wheat, Droplets, Check, Calendar } from 'lucide-react';
import { foodDatabase, calcCalories } from '../data/foodDatabase';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function ChefModal({ isOpen, onClose, mealTarget, mealType, remaining, remainingMeals, onLogMeal, onLogMultipleMeals }) {
  const [suggestion, setSuggestion] = useState(null);
  const [fullDayPlan, setFullDayPlan] = useState(null);
  const [mode, setMode] = useState('single'); // 'single' o 'fullday'

  const customFoods = useLiveQuery(() => db.customFoods.toArray()) || [];
  const combinedDatabase = [...foodDatabase, ...customFoods];

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generateSingleMealCart = (targetP, targetC, targetF, skipFats = false) => {
    const proteins = combinedDatabase.filter(f => f.category === 'protein' && (!skipFats || f.digestion !== 'slow'));
    const carbs = combinedDatabase.filter(f => f.category === 'carbs' && (!skipFats || f.digestion !== 'slow'));
    const fats = combinedDatabase.filter(f => f.category === 'fats');

    let cart = [];

    if (targetP > 0) {
      const pFood = rand(proteins);
      const needed = Math.round((targetP * 100) / pFood.p);
      cart.push({ id: Date.now() + Math.random(), food: pFood, grams: needed, providedMacro: targetP });
    }

    if (targetC > 0) {
      const cFood = rand(carbs);
      const needed = Math.round((targetC * 100) / cFood.c);
      cart.push({ id: Date.now() + Math.random(), food: cFood, grams: needed, providedMacro: targetC });
    }

    if (targetF > 0 && !skipFats) {
      const fFood = rand(fats);
      const needed = Math.round((targetF * 100) / fFood.f);
      cart.push({ id: Date.now() + Math.random(), food: fFood, grams: needed, providedMacro: targetF });
    }

    return cart;
  };

  const generateMeal = () => {
    setSuggestion(generateSingleMealCart(mealTarget.protein, mealTarget.carbs, mealTarget.fats));
  };

  const generateFullDay = () => {
    // Si quedan 4 comidas (mañana):
    // Desayuno (P/4, C/4, F/4)
    // Comida (P/4, C/4, F/4)
    // Pre-entreno (P/4, C/4, F=0)
    // Cena (P/4, C/4, F/2)
    
    // Lo haremos genérico dependiendo de cuántas falten
    const plan = [];
    
    if (remainingMeals === 4) {
      const p4 = Math.round(remaining.protein / 4);
      const c4 = Math.round(remaining.carbs / 4);
      const f4 = Math.round(remaining.fats / 4);
      
      plan.push({ mealType: 'Desayuno', cart: generateSingleMealCart(p4, c4, f4) });
      plan.push({ mealType: 'Comida (Universidad)', cart: generateSingleMealCart(p4, c4, f4) });
      plan.push({ mealType: 'Pre-Entreno', cart: generateSingleMealCart(p4, c4, 0, true) }); // skipFats = true
      
      const pRest = remaining.protein - (p4 * 3);
      const cRest = remaining.carbs - (c4 * 3);
      const fRest = remaining.fats - (f4 * 2); // Queda la mitad de grasas
      plan.push({ mealType: 'Cena / Post-Entreno', cart: generateSingleMealCart(pRest, cRest, fRest) });
    } else {
      // Si el usuario pide un plan a mitad del día, simplemente dividimos equitativamente 
      // lo que falta, respetando que el pre-entreno no tiene grasas.
      let pPerMeal = Math.round(remaining.protein / remainingMeals);
      let cPerMeal = Math.round(remaining.carbs / remainingMeals);
      let fPerMeal = Math.round(remaining.fats / remainingMeals);
      
      let pUsed = 0, cUsed = 0, fUsed = 0;
      
      const mealNames = {
        3: ['Comida (Universidad)', 'Pre-Entreno', 'Cena / Post-Entreno'],
        2: ['Pre-Entreno', 'Cena / Post-Entreno'],
        1: ['Cena / Post-Entreno']
      };
      
      const names = mealNames[remainingMeals] || [];
      
      for (let i = 0; i < remainingMeals; i++) {
        const name = names[i];
        const isPre = name === 'Pre-Entreno';
        const isLast = i === remainingMeals - 1;
        
        let targetP = isLast ? remaining.protein - pUsed : pPerMeal;
        let targetC = isLast ? remaining.carbs - cUsed : cPerMeal;
        let targetF = isLast ? remaining.fats - fUsed : (isPre ? 0 : fPerMeal);
        
        plan.push({ mealType: name, cart: generateSingleMealCart(targetP, targetC, targetF, isPre) });
        
        pUsed += targetP;
        cUsed += targetC;
        fUsed += targetF;
      }
    }
    
    setFullDayPlan(plan);
  };

  useEffect(() => {
    if (isOpen) {
      if (remainingMeals === 4) {
        setMode('fullday');
        generateFullDay();
      } else {
        setMode('single');
        generateMeal();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAllDone = remaining.protein <= 0 && remaining.carbs <= 0 && remaining.fats <= 0;

  const renderSingleCart = (cart, hideSummary = false) => {
    const totalCals = cart?.reduce((acc, item) => acc + Math.round((item.grams / 100) * calcCalories(item.food)), 0) || 0;
    const totalP = cart?.reduce((acc, item) => acc + (item.food.category === 'protein' ? item.providedMacro : 0), 0) || 0;
    const totalC = cart?.reduce((acc, item) => acc + (item.food.category === 'carbs' ? item.providedMacro : 0), 0) || 0;
    const totalF = cart?.reduce((acc, item) => acc + (item.food.category === 'fats' ? item.providedMacro : 0), 0) || 0;

    return (
      <div className="space-y-3">
        {!hideSummary && (
          <div className="flex justify-between bg-spidey-gray/10 p-2 rounded-xl border border-spidey-gray/20">
            <div className="flex flex-col items-center">
              <Flame size={14} className="text-spidey-red mb-1" />
              <span className="text-[10px] font-archivo text-spidey-white">{totalCals} kcal</span>
            </div>
            <div className="flex flex-col items-center">
              <Beef size={14} className="text-spidey-blue mb-1" />
              <span className="text-[10px] font-archivo text-spidey-white">{totalP}g P</span>
            </div>
            <div className="flex flex-col items-center">
              <Wheat size={14} className="text-spidey-amber mb-1" />
              <span className="text-[10px] font-archivo text-spidey-white">{totalC}g C</span>
            </div>
            <div className="flex flex-col items-center">
              <Droplets size={14} className="text-spidey-gray mb-1" />
              <span className="text-[10px] font-archivo text-spidey-white">{totalF}g G</span>
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          {cart.map(item => (
            <div key={item.id} className="bg-spidey-black border border-spidey-gray/30 p-2 rounded-lg flex justify-between items-center">
              <div>
                <span className="font-work text-spidey-white text-xs">{item.food.name}</span>
              </div>
              <div className="bg-spidey-gray/20 px-2 py-1 rounded-md">
                <span className="font-bold text-spidey-white text-xs">{item.grams}g</span>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <p className="text-xs text-spidey-gray italic py-2 text-center">Sin alimentos generados (Macros completados).</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111112] w-full max-w-md border border-spidey-blue/30 rounded-3xl p-6 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-5 right-5 text-spidey-gray hover:text-spidey-white z-10">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-6 shrink-0">
          <div className="text-4xl mb-2">👨‍🍳</div>
          <h3 className="text-2xl font-bebas text-spidey-blue tracking-wide text-center">El Chef Inteligente</h3>
          <p className="text-sm font-work text-spidey-gray text-center mt-1">Arma tu día perfecto</p>
        </div>

        {isAllDone ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-green-500 mb-2">
              <Check size={48} />
            </div>
            <h4 className="text-xl font-bebas text-spidey-white">¡Misión Cumplida!</h4>
            <p className="text-spidey-gray font-work text-sm mt-2">Ya alcanzaste tu requerimiento de macros para hoy. No necesitas más sugerencias.</p>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            {remainingMeals > 1 && (
              <div className="flex bg-spidey-black rounded-xl p-1 mb-4 shrink-0 border border-spidey-gray/20">
                <button 
                  onClick={() => { setMode('single'); generateMeal(); }}
                  className={`flex-1 py-2 text-xs font-archivo uppercase rounded-lg transition-colors ${mode === 'single' ? 'bg-spidey-blue text-white' : 'text-spidey-gray hover:text-spidey-white'}`}
                >
                  Solo {mealType}
                </button>
                <button 
                  onClick={() => { setMode('fullday'); generateFullDay(); }}
                  className={`flex-1 py-2 text-xs font-archivo uppercase rounded-lg transition-colors ${mode === 'fullday' ? 'bg-spidey-blue text-white' : 'text-spidey-gray hover:text-spidey-white'}`}
                >
                  Día Completo ({remainingMeals} Comidas)
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {mode === 'single' && suggestion && (
                <div className="space-y-4">
                  <h4 className="font-bebas text-spidey-amber text-lg tracking-wide border-b border-spidey-gray/20 pb-1">
                    {mealType}
                  </h4>
                  {renderSingleCart(suggestion)}
                </div>
              )}

              {mode === 'fullday' && fullDayPlan && (
                <div className="space-y-5">
                  {fullDayPlan.map((meal, idx) => (
                    <div key={idx}>
                      <h4 className="font-bebas text-spidey-amber text-lg tracking-wide border-b border-spidey-gray/20 pb-1 mb-2">
                        {meal.mealType}
                        {meal.mealType === 'Pre-Entreno' && <span className="ml-2 text-xs font-work text-spidey-gray uppercase normal-case">(Sin grasas)</span>}
                      </h4>
                      {renderSingleCart(meal.cart)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="pt-4 space-y-3 shrink-0 mt-2 border-t border-spidey-gray/20">
              <button 
                onClick={mode === 'single' ? generateMeal : generateFullDay}
                className="w-full bg-transparent border border-spidey-blue text-spidey-blue font-archivo font-bold uppercase py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-spidey-blue/10 transition-colors"
              >
                <RefreshCw size={18} />
                Mezclar de nuevo
              </button>
              
              {mode === 'single' ? (
                <button 
                  onClick={() => onLogMeal(suggestion)}
                  className="w-full bg-spidey-blue text-white font-archivo font-bold uppercase py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                >
                  <Plus size={18} />
                  Registrar {mealType}
                </button>
              ) : (
                <button 
                  onClick={() => onLogMultipleMeals(fullDayPlan)}
                  className="w-full bg-spidey-amber text-[#111112] font-archivo font-bold uppercase py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-colors shadow-[0_2px_10px_rgba(242,169,0,0.2)]"
                >
                  <Calendar size={18} />
                  Guardar Plan Completo
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
