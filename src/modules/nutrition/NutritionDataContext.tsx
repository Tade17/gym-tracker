import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react';
import type { Food, DayLog, Recipe } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../lib/storage';
import { SEED_FOODS, DEFAULT_GOALS, BASE_RECIPE_SPECS } from './constants';
import { resolveRecipeSpecs } from './utils/recipeSeeder';

type Goals = typeof DEFAULT_GOALS;

interface NutritionData {
  foods:       Food[];
  dayLogs:     DayLog[];
  goals:       Goals;
  recipes:     Recipe[];
  setFoods:    React.Dispatch<React.SetStateAction<Food[]>>;
  setDayLogs:  React.Dispatch<React.SetStateAction<DayLog[]>>;
  setGoals:    React.Dispatch<React.SetStateAction<Goals>>;
  setRecipes:  React.Dispatch<React.SetStateAction<Recipe[]>>;
}

const Ctx = createContext<NutritionData | null>(null);

export function NutritionDataProvider({ children }: { children: ReactNode }) {
  const [foods,   setFoods]   = useLocalStorage<Food[]>(STORAGE_KEYS.foods,   SEED_FOODS);
  const [dayLogs, setDayLogs] = useLocalStorage<DayLog[]>(STORAGE_KEYS.dayLogs, []);
  const [goals,   setGoals]   = useLocalStorage<Goals>('nutrition:goals',      DEFAULT_GOALS);
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>(STORAGE_KEYS.recipes, []);

  // ── Seed de recetas base ────────────────────────────────────────────────────
  // Se ejecuta una sola vez (cuando recipes está vacío) y:
  //   1. Añade los alimentos extra que las recetas necesitan (zanahoria, tomate, etc.)
  //      solo si no están ya en la base de datos.
  //   2. Genera las 7 recetas base con los IDs reales resueltos.
  //
  // Motivo de useEffect con []: useLocalStorage carga desde localStorage de forma
  // síncrona en el useState inicial, así que `foods` ya tiene los datos correctos
  // en el primer render cuando el efecto se ejecuta.
  useEffect(() => {
    if (recipes.length > 0) return;
    const { newFoods, recipes: baseRecipes } = resolveRecipeSpecs(BASE_RECIPE_SPECS, foods);
    if (newFoods.length > 0) {
      setFoods(prev => [...prev, ...newFoods]);
    }
    setRecipes(baseRecipes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<NutritionData>(
    () => ({ foods, dayLogs, goals, recipes, setFoods, setDayLogs, setGoals, setRecipes }),
    [foods, dayLogs, goals, recipes, setFoods, setDayLogs, setGoals, setRecipes],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNutritionData(): NutritionData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNutritionData debe usarse dentro de <NutritionDataProvider>');
  return v;
}
