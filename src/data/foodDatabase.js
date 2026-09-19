// Base de datos de alimentos económicos y comunes.
// Macros calculados por cada 100g de alimento en estado CRUDO (a menos que se indique lo contrario).

export const foodDatabase = [
  // ================= PROTEÍNAS =================
  { id: 'p1', name: 'Pechuga de Pollo (Cruda)', category: 'protein', p: 23, c: 0, f: 1.2, digestion: 'medium' },
  { id: 'p2', name: 'Atún en Agua (Drenado)', category: 'protein', p: 25, c: 0, f: 1, digestion: 'fast' },
  { id: 'p3', name: 'Claras de Huevo (Líquidas)', category: 'protein', p: 11, c: 0.7, f: 0.2, digestion: 'fast' },
  { id: 'p4', name: 'Huevo Entero (1 pieza ~50g)', category: 'protein', p: 13, c: 1, f: 11, digestion: 'medium' }, // Macros adaptados a 100g para mantener cálculo consistente: 100g = 2 huevos.
  { id: 'p5', name: 'Queso Panela', category: 'protein', p: 18, c: 2, f: 14, digestion: 'medium' },
  { id: 'p6', name: 'Queso Cottage (Bajo en grasa)', category: 'protein', p: 11, c: 3, f: 1, digestion: 'slow' },
  { id: 'p7', name: 'Lomo de Cerdo (Magro)', category: 'protein', p: 21, c: 0, f: 4, digestion: 'medium' },
  { id: 'p8', name: 'Filete de Res (Magro)', category: 'protein', p: 22, c: 0, f: 5, digestion: 'slow' },
  { id: 'p9', name: 'Whey Protein (Polvo)', category: 'protein', p: 75, c: 5, f: 3, digestion: 'fast' },
  { id: 'p10', name: 'Yogur Griego (Natural sin azúcar)', category: 'protein', p: 10, c: 4, f: 0, digestion: 'medium' },
  { id: 'p11', name: 'Frijoles (Hervidos)', category: 'protein', p: 9, c: 21, f: 0.5, digestion: 'slow' },
  { id: 'p12', name: 'Pavo (Molida magra)', category: 'protein', p: 20, c: 0, f: 7, digestion: 'medium' },

  // ================= CARBOHIDRATOS =================
  { id: 'c1', name: 'Avena (Hojuelas crudas)', category: 'carbs', p: 13, c: 68, f: 7, digestion: 'slow' },
  { id: 'c2', name: 'Arroz Blanco (Crudo)', category: 'carbs', p: 7, c: 80, f: 0.6, digestion: 'fast' },
  { id: 'c3', name: 'Arroz Integral (Crudo)', category: 'carbs', p: 7.5, c: 76, f: 2.7, digestion: 'slow' },
  { id: 'c4', name: 'Papa Blanca (Cruda)', category: 'carbs', p: 2, c: 17, f: 0.1, digestion: 'fast' }, // Muy rápido si se hornea/hierve sin grasa
  { id: 'c5', name: 'Camote (Crudo)', category: 'carbs', p: 1.6, c: 20, f: 0.1, digestion: 'medium' },
  { id: 'c6', name: 'Tortilla de Maíz (por 100g, ~3 tortillas)', category: 'carbs', p: 6, c: 45, f: 2.5, digestion: 'medium' },
  { id: 'c7', name: 'Pan de Caja Integral', category: 'carbs', p: 10, c: 43, f: 4, digestion: 'medium' },
  { id: 'c8', name: 'Pan de Caja Blanco', category: 'carbs', p: 9, c: 49, f: 3, digestion: 'fast' },
  { id: 'c9', name: 'Plátano (Crudo)', category: 'carbs', p: 1, c: 23, f: 0.3, digestion: 'fast' },
  { id: 'c10', name: 'Manzana (Cruda)', category: 'carbs', p: 0.3, c: 14, f: 0.2, digestion: 'fast' },
  { id: 'c11', name: 'Fideos de Pasta (Crudos)', category: 'carbs', p: 12, c: 75, f: 1.5, digestion: 'medium' },
  { id: 'c12', name: 'Galletas de Arroz (Rice Cakes)', category: 'carbs', p: 8, c: 81, f: 2.8, digestion: 'fast' },
  { id: 'c13', name: 'Lentejas (Crudas)', category: 'carbs', p: 25, c: 60, f: 1, digestion: 'slow' },
  { id: 'c14', name: 'Cereal de Maíz (Corn Flakes)', category: 'carbs', p: 8, c: 84, f: 0.5, digestion: 'fast' },

  // ================= GRASAS =================
  { id: 'f1', name: 'Crema de Cacahuate (Natural)', category: 'fats', p: 25, c: 20, f: 50, digestion: 'slow' },
  { id: 'f2', name: 'Aguacate', category: 'fats', p: 2, c: 9, f: 15, digestion: 'medium' },
  { id: 'f3', name: 'Aceite de Oliva', category: 'fats', p: 0, c: 0, f: 100, digestion: 'slow' },
  { id: 'f4', name: 'Almendras', category: 'fats', p: 21, c: 22, f: 49, digestion: 'slow' },
  { id: 'f5', name: 'Nueces', category: 'fats', p: 15, c: 14, f: 65, digestion: 'slow' },
  { id: 'f6', name: 'Mantequilla', category: 'fats', p: 0.8, c: 0.1, f: 81, digestion: 'slow' },
  { id: 'f7', name: 'Mayonesa', category: 'fats', p: 1, c: 0.6, f: 75, digestion: 'slow' },
  { id: 'f8', name: 'Chocolate Amargo (70%+)', category: 'fats', p: 8, c: 46, f: 43, digestion: 'slow' }
];

// Función helper para calcular las calorías de 100g de alimento
export const calcCalories = (food) => {
  return Math.round((food.p * 4) + (food.c * 4) + (food.f * 9));
};
