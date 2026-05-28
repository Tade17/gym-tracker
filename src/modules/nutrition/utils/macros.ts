import type { Food, FoodEntry, Meal, DayLog, MacroTotals, Recipe } from '../../../types';

export function addTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    kcal:    a.kcal    + b.kcal,
    protein: a.protein + b.protein,
    carbs:   a.carbs   + b.carbs,
    fat:     a.fat     + b.fat,
  };
}

export const ZERO_TOTALS: MacroTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

// Calcula los macros de una entrada (alimento + gramos consumidos).
// Regla de tres: si 100g tienen X kcal, N gramos tienen N/100 * X kcal.
export function calcEntry(entry: FoodEntry, food: Food): MacroTotals {
  const f = entry.grams / 100;
  return {
    kcal:    Math.round(food.kcalPer100g    * f * 10) / 10,
    protein: Math.round(food.proteinPer100g * f * 10) / 10,
    carbs:   Math.round(food.carbsPer100g   * f * 10) / 10,
    fat:     Math.round(food.fatPer100g     * f * 10) / 10,
  };
}

export function calcMeal(meal: Meal, foodMap: Map<string, Food>): MacroTotals {
  return meal.entries.reduce((acc, entry) => {
    const food = foodMap.get(entry.foodId);
    if (!food) return acc;
    return addTotals(acc, calcEntry(entry, food));
  }, ZERO_TOTALS);
}

// Calcula los macros de una receta según el porcentaje de porción.
// portionPct=100 → receta completa; portionPct=80 → el 80% de cada ingrediente.
export function calcRecipeUse(
  recipe: Recipe,
  foodMap: Map<string, Food>,
  portionPct: number,
): MacroTotals {
  const factor = portionPct / 100;
  return recipe.ingredients.reduce((acc, ing) => {
    const food = foodMap.get(ing.foodId);
    if (!food) return acc;
    const scaledGrams = ing.grams * factor;
    const m = calcEntry({ id: '', foodId: ing.foodId, grams: scaledGrams }, food);
    return addTotals(acc, m);
  }, ZERO_TOTALS);
}

// calcDay suma comidas individuales + usos de receta.
// recipeMap es opcional para mantener compatibilidad hacia atrás con
// los sitios del código que aún no pasan recetas (Dashboard, etc.).
export function calcDay(
  log: DayLog,
  foodMap: Map<string, Food>,
  recipeMap?: Map<string, Recipe>,
): MacroTotals {
  const mealsTotals = log.meals.reduce(
    (acc, meal) => addTotals(acc, calcMeal(meal, foodMap)),
    ZERO_TOTALS,
  );

  if (!recipeMap || !log.recipeUses?.length) return mealsTotals;

  return log.recipeUses.reduce((acc, ru) => {
    const recipe = recipeMap.get(ru.recipeId);
    if (!recipe) return acc;
    return addTotals(acc, calcRecipeUse(recipe, foodMap, ru.portionPct));
  }, mealsTotals);
}

// Redondea a 1 decimal para mostrar en UI.
export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
