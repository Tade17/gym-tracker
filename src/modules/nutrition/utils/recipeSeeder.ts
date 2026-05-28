import type { Food, Recipe } from '../../../types';
import type { BaseRecipeSpec } from '../constants';
import { EXTRA_SEED_FOODS } from '../constants';
import { uid } from '../../../lib/id';

// Compara nombre del alimento existente vs el término buscado.
// Una coincidencia parcial (A contiene B o B contiene A) es suficiente.
function matchFood(food: Food, term: string): boolean {
  const fn = food.name.toLowerCase();
  const tn = term.toLowerCase();
  return fn.includes(tn) || tn.includes(fn);
}

// Dado un array de specs, resuelve cada ingrediente al foodId real.
// Si un alimento requerido no existe en `foods`, lo crea y lo devuelve
// en `newFoods` para que el llamador pueda añadirlo al estado.
//
// Retorna:
//   newFoods  — alimentos nuevos que hay que añadir a la base de datos
//   recipes   — recetas con IDs reales
export function resolveRecipeSpecs(
  specs: BaseRecipeSpec[],
  existingFoods: Food[],
): { newFoods: Food[]; recipes: Recipe[] } {
  // Trabajamos sobre una copia local para poder insertar los nuevos alimentos
  // y que los siguientes specs los encuentren de inmediato.
  const allFoods: Food[] = [...existingFoods];
  const newFoods: Food[] = [];

  // Garantiza que los alimentos extra (zanahoria, tomate, lechuga, betarraga)
  // estén presentes, añadiéndolos solo si faltan.
  for (const extra of EXTRA_SEED_FOODS) {
    const found = allFoods.some(f => f.name.toLowerCase().includes(extra.nameMatch));
    if (!found) {
      const f: Food = { id: uid(), ...extra.food };
      allFoods.push(f);
      newFoods.push(f);
    }
  }

  const recipes: Recipe[] = specs.map(spec => ({
    id: uid(),
    name: spec.name,
    ingredients: spec.ingredients
      .map(ing => {
        const food = allFoods.find(f => matchFood(f, ing.foodName));
        if (!food) return null;
        return { foodId: food.id, grams: ing.grams };
      })
      .filter((x): x is { foodId: string; grams: number } => x !== null),
  }));

  return { newFoods, recipes };
}
