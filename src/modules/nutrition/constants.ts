import type { Food, MacroGoal, MealCategory } from '../../types';
import { uid } from '../../lib/id';

// Spec de una receta base: usa nombres de alimento en lugar de IDs,
// porque los IDs de SEED_FOODS son generados aleatoriamente con uid().
// La resolución a IDs reales ocurre en NutritionDataContext al inicializar.
export interface BaseRecipeSpec {
  name: string;
  ingredients: { foodName: string; grams: number }[];
}

// Alimentos que las recetas base necesitan pero que no estaban en SEED_FOODS.
// nameMatch es la subcadena a buscar (insensible a mayúsculas).
export const EXTRA_SEED_FOODS: Array<{ nameMatch: string; food: Omit<Food, 'id'> }> = [
  { nameMatch: 'zanahoria', food: { name: 'Zanahoria',        kcalPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10,  fatPer100g: 0.2 } },
  { nameMatch: 'tomate',    food: { name: 'Tomate',           kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 } },
  { nameMatch: 'lechuga',   food: { name: 'Lechuga',          kcalPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.2, fatPer100g: 0.2 } },
  { nameMatch: 'betarraga', food: { name: 'Betarraga cocida', kcalPer100g: 44, proteinPer100g: 1.7, carbsPer100g: 10,  fatPer100g: 0.2 } },
];

export const BASE_RECIPE_SPECS: BaseRecipeSpec[] = [
  {
    name: 'Desayuno estándar',
    ingredients: [
      { foodName: 'Huevo entero',    grams: 150 },
      { foodName: 'Avena',           grams: 50  },
      { foodName: 'Plátano',         grams: 100 },
    ],
  },
  {
    name: 'Almuerzo entrenamiento',
    ingredients: [
      { foodName: 'Pechuga de pollo', grams: 200 },
      { foodName: 'Arroz blanco',     grams: 150 },
      { foodName: 'Zanahoria',        grams: 50  },
      { foodName: 'Tomate',           grams: 50  },
      { foodName: 'Lechuga',          grams: 30  },
      { foodName: 'Aceite de oliva',  grams: 5   },
    ],
  },
  {
    name: 'Almuerzo descanso',
    ingredients: [
      { foodName: 'Pechuga de pollo', grams: 200 },
      { foodName: 'Arroz blanco',     grams: 100 },
      { foodName: 'Zanahoria',        grams: 50  },
      { foodName: 'Tomate',           grams: 50  },
      { foodName: 'Lechuga',          grams: 30  },
      { foodName: 'Aceite de oliva',  grams: 5   },
    ],
  },
  {
    name: 'Cena post-entreno',
    ingredients: [
      { foodName: 'Pechuga de pollo', grams: 250 },
      { foodName: 'Patata cocida',    grams: 150 },
      { foodName: 'Huevo entero',     grams: 100 },
      { foodName: 'Tomate',           grams: 50  },
      { foodName: 'Lechuga',          grams: 30  },
    ],
  },
  {
    name: 'Cena día descanso',
    ingredients: [
      { foodName: 'Pechuga de pollo', grams: 250 },
      { foodName: 'Huevo entero',     grams: 100 },
      { foodName: 'Zanahoria',        grams: 50  },
      { foodName: 'Betarraga',        grams: 50  },
      { foodName: 'Lechuga',          grams: 30  },
      { foodName: 'Aceite de oliva',  grams: 5   },
    ],
  },
  {
    name: 'Pre-entreno',
    ingredients: [
      { foodName: 'Plátano', grams: 100 },
    ],
  },
  {
    name: 'Merienda',
    ingredients: [
      { foodName: 'Yogur griego', grams: 200 },
      { foodName: 'Manzana',      grams: 100 },
    ],
  },
];

// Objetivos predefinidos del usuario (los indicaste en el brief).
// Los guardamos aquí como fallback; el usuario puede editarlos en Ajustes.
export const DEFAULT_GOALS: { trainingDay: MacroGoal; restDay: MacroGoal } = {
  trainingDay: { kcal: 2350, protein: 150, carbs: 265, fat: 65 },
  restDay:     { kcal: 2050, protein: 150, carbs: 185, fat: 65 },
};

export const MEAL_CATEGORIES: MealCategory[] = [
  'desayuno', 'almuerzo', 'merienda', 'preentreno', 'cena',
];

export const MEAL_LABEL: Record<MealCategory, string> = {
  desayuno:   'Desayuno',
  almuerzo:   'Almuerzo',
  merienda:   'Merienda',
  preentreno: 'Pre-entreno',
  cena:       'Cena',
};

// Iconos de Lucide para cada comida (nombres de componente, no el componente en sí).
// Lo usamos en NutritionDay para pasar el icono correcto.
export const MEAL_ICON: Record<MealCategory, string> = {
  desayuno:   'Sunrise',
  almuerzo:   'UtensilsCrossed',
  merienda:   'Apple',
  preentreno: 'Zap',
  cena:       'Moon',
};

// Colores de macro para las barras de progreso.
export const MACRO_COLOR = {
  kcal:    'bg-orange-500',
  protein: 'bg-blue-400',
  carbs:   'bg-yellow-400',
  fat:     'bg-pink-400',
} as const;

// Alimentos semilla con macros precisos por 100g.
// Fuente: bases de datos nutricionales estándar.
export const SEED_FOODS: Food[] = [
  // Proteínas
  { id: uid(), name: 'Pechuga de pollo (plancha)',  kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0,  fatPer100g: 3.6 },
  { id: uid(), name: 'Huevo entero (M)',             kcalPer100g: 143, proteinPer100g: 13, carbsPer100g: 0.7, fatPer100g: 9.5 },
  { id: uid(), name: 'Clara de huevo',               kcalPer100g: 52,  proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { id: uid(), name: 'Atún en agua (escurrido)',     kcalPer100g: 103, proteinPer100g: 24, carbsPer100g: 0,  fatPer100g: 0.5 },
  { id: uid(), name: 'Salmón',                       kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0,  fatPer100g: 13  },
  { id: uid(), name: 'Ternera magra (90/10)',        kcalPer100g: 170, proteinPer100g: 26, carbsPer100g: 0,  fatPer100g: 7   },
  { id: uid(), name: 'Requesón',                     kcalPer100g: 74,  proteinPer100g: 12, carbsPer100g: 3.3, fatPer100g: 0.4 },
  { id: uid(), name: 'Yogur griego natural (0%)',    kcalPer100g: 57,  proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: uid(), name: 'Proteína whey (scoop 30g)',    kcalPer100g: 380, proteinPer100g: 78, carbsPer100g: 6,  fatPer100g: 5   },
  // Hidratos
  { id: uid(), name: 'Arroz blanco cocido',          kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: uid(), name: 'Pasta cocida',                 kcalPer100g: 131, proteinPer100g: 5,   carbsPer100g: 25, fatPer100g: 1.1 },
  { id: uid(), name: 'Avena (cruda)',                kcalPer100g: 379, proteinPer100g: 13,  carbsPer100g: 66, fatPer100g: 7   },
  { id: uid(), name: 'Pan integral',                 kcalPer100g: 247, proteinPer100g: 9,   carbsPer100g: 41, fatPer100g: 4   },
  { id: uid(), name: 'Patata cocida',                kcalPer100g: 87,  proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1 },
  { id: uid(), name: 'Plátano',                      kcalPer100g: 89,  proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { id: uid(), name: 'Manzana',                      kcalPer100g: 52,  proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  // Grasas / mixtos
  { id: uid(), name: 'Aceite de oliva virgen extra', kcalPer100g: 884, proteinPer100g: 0,   carbsPer100g: 0,  fatPer100g: 100 },
  { id: uid(), name: 'Almendras',                    kcalPer100g: 579, proteinPer100g: 21,  carbsPer100g: 10, fatPer100g: 50  },
  { id: uid(), name: 'Leche semidesnatada',          kcalPer100g: 46,  proteinPer100g: 3.4, carbsPer100g: 5,  fatPer100g: 1.7 },
];
