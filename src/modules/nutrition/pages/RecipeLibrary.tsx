import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Copy, ChefHat, RotateCcw, Search, X, Check } from 'lucide-react';
import type { Recipe, RecipeIngredient, Food } from '../../../types';
import { useNutritionData } from '../NutritionDataContext';
import { BASE_RECIPE_SPECS } from '../constants';
import { resolveRecipeSpecs } from '../utils/recipeSeeder';
import { calcRecipeUse, fmt } from '../utils/macros';
import { uid } from '../../../lib/id';

export default function RecipeLibrary() {
  const { recipes, setRecipes, foods, setFoods } = useNutritionData();

  const [editing,   setEditing]   = useState<Recipe | null>(null);
  const [showForm,  setShowForm]  = useState(false);

  const foodMap = useMemo(() => new Map(foods.map(f => [f.id, f])), [foods]);

  function handleSave(data: Omit<Recipe, 'id'>) {
    if (editing) {
      setRecipes(rs => rs.map(r => r.id === editing.id ? { ...editing, ...data } : r));
    } else {
      setRecipes(rs => [...rs, { id: uid(), ...data }]);
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDuplicate(recipe: Recipe) {
    const copy: Recipe = { ...recipe, id: uid(), name: `${recipe.name} (copia)` };
    setRecipes(rs => [...rs, copy]);
  }

  function handleDelete(recipe: Recipe) {
    if (!confirm(`¿Eliminar la receta "${recipe.name}"?`)) return;
    setRecipes(rs => rs.filter(r => r.id !== recipe.id));
  }

  // Restaura las recetas base que no existen aún (comparando por nombre).
  function handleRestoreBase() {
    const existingNames = new Set(recipes.map(r => r.name.toLowerCase().trim()));
    const missingSpecs = BASE_RECIPE_SPECS.filter(
      s => !existingNames.has(s.name.toLowerCase().trim()),
    );
    if (missingSpecs.length === 0) {
      alert('Ya tienes todas las recetas base. No hay nada que restaurar.');
      return;
    }
    if (!confirm(`Se añadirán ${missingSpecs.length} recetas que no tenías. ¿Continuar?`)) return;
    const { newFoods, recipes: newRecipes } = resolveRecipeSpecs(missingSpecs, foods);
    if (newFoods.length > 0) setFoods(f => [...f, ...newFoods]);
    setRecipes(rs => [...rs, ...newRecipes]);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat size={22} className="text-cyan-400" />
          <h1 className="text-2xl font-bold">Recetas</h1>
          <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">
            {recipes.length}
          </span>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-cyan-500 text-slate-900 font-semibold px-3 py-1.5 rounded-xl text-sm"
        >
          <Plus size={16} /> Nueva
        </button>
      </header>

      {/* Info banner */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-xs text-slate-400 leading-relaxed">
        Crea recetas con ingredientes de tu base de datos y añádelas al registro diario con un toque.{' '}
        <button
          onClick={handleRestoreBase}
          className="text-cyan-400 underline underline-offset-2"
        >
          Restaurar recetas base
        </button>
        {' '}para recuperar las 7 recetas predefinidas.
      </div>

      {/* Botón restaurar + contador */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleRestoreBase}
          className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs transition-colors"
        >
          <RotateCcw size={13} /> Restaurar base
        </button>
      </div>

      {/* Lista de recetas */}
      <ul className="space-y-2">
        {recipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            foodMap={foodMap}
            onEdit={() => { setEditing(recipe); setShowForm(true); }}
            onDuplicate={() => handleDuplicate(recipe)}
            onDelete={() => handleDelete(recipe)}
          />
        ))}
        {recipes.length === 0 && (
          <li className="text-center text-slate-500 py-10 text-sm">
            Sin recetas. Crea una o restaura las recetas base.
          </li>
        )}
      </ul>

      {showForm && (
        <RecipeForm
          initial={editing}
          foods={foods}
          foodMap={foodMap}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ─── Tarjeta de receta ────────────────────────────────────────────────────────

function RecipeCard({ recipe, foodMap, onEdit, onDuplicate, onDelete }: {
  recipe: Recipe;
  foodMap: Map<string, Food>;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totals = useMemo(() => calcRecipeUse(recipe, foodMap, 100), [recipe, foodMap]);

  return (
    <li className="bg-slate-800 border border-slate-700/40 rounded-xl overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center px-3 py-2.5 gap-2">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 text-left min-w-0"
        >
          <div className="font-medium text-sm truncate">{recipe.name}</div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span className="text-orange-400 font-medium">{Math.round(totals.kcal)} kcal</span>
            <span>·</span>
            <span>{fmt(totals.protein)}g P</span>
            <span>·</span>
            <span>{fmt(totals.carbs)}g C</span>
            <span>·</span>
            <span>{fmt(totals.fat)}g G</span>
            <span className="text-slate-600">· {recipe.ingredients.length} ing.</span>
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit}      className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors" aria-label="Editar"><Pencil size={14} /></button>
          <button onClick={onDuplicate} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors" aria-label="Duplicar"><Copy size={14} /></button>
          <button onClick={onDelete}    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" aria-label="Eliminar"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Ingredientes expandibles */}
      {expanded && (
        <ul className="border-t border-slate-700/40 divide-y divide-slate-700/20">
          {recipe.ingredients.map((ing, i) => {
            const food = foodMap.get(ing.foodId);
            if (!food) return null;
            const f = ing.grams / 100;
            const kcal = Math.round(food.kcalPer100g * f);
            return (
              <li key={i} className="flex items-center justify-between px-3 py-1.5">
                <span className="text-sm text-slate-300">{food.name}</span>
                <span className="text-xs text-slate-500">{ing.grams}g · {kcal} kcal</span>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

// ─── Formulario de receta ─────────────────────────────────────────────────────

interface FormProps {
  initial: Recipe | null;
  foods: Food[];
  foodMap: Map<string, Food>;
  onSave: (data: Omit<Recipe, 'id'>) => void;
  onCancel: () => void;
}

function RecipeForm({ initial, foods, foodMap, onSave, onCancel }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initial?.ingredients ?? [],
  );
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [pendingFood, setPendingFood]       = useState<Food | null>(null);
  const [pendingGrams, setPendingGrams]     = useState('100');
  const [searchQuery, setSearchQuery]       = useState('');

  const filteredFoods = useMemo(
    () => foods
      .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [foods, searchQuery],
  );

  const totals = useMemo(
    () => ingredients.reduce(
      (acc, ing) => {
        const food = foodMap.get(ing.foodId);
        if (!food) return acc;
        const f = ing.grams / 100;
        return {
          kcal:    acc.kcal    + food.kcalPer100g    * f,
          protein: acc.protein + food.proteinPer100g * f,
          carbs:   acc.carbs   + food.carbsPer100g   * f,
          fat:     acc.fat     + food.fatPer100g     * f,
        };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    ),
    [ingredients, foodMap],
  );

  function confirmFood() {
    if (!pendingFood) return;
    const g = parseFloat(pendingGrams);
    if (!g || g <= 0) return;
    setIngredients(prev => [...prev, { foodId: pendingFood.id, grams: g }]);
    setPendingFood(null);
    setSearchQuery('');
    setShowFoodSearch(false);
  }

  function removeIngredient(index: number) {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }

  function updateGrams(index: number, grams: number) {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, grams } : ing));
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-40 flex items-end sm:items-center justify-center px-4 pb-20"
      onClick={onCancel}
    >
      <div
        className="bg-slate-800 rounded-2xl p-4 w-full max-w-md max-h-[90vh] flex flex-col gap-3 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold shrink-0">
          {initial ? 'Editar receta' : 'Nueva receta'}
        </h2>

        {/* Nombre */}
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la receta"
          autoFocus
          className="field-input shrink-0"
        />

        {/* Totales en tiempo real */}
        {ingredients.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 shrink-0">
            {[
              { label: 'kcal', value: Math.round(totals.kcal), color: 'text-orange-400' },
              { label: 'Prot', value: fmt(totals.protein), color: 'text-blue-400' },
              { label: 'Carb', value: fmt(totals.carbs),   color: 'text-yellow-400' },
              { label: 'Gras', value: fmt(totals.fat),     color: 'text-pink-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900 rounded-xl py-1.5 text-center">
                <div className={`text-sm font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de ingredientes */}
        <div className="overflow-y-auto flex-1 space-y-1.5 min-h-0">
          {ingredients.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">Sin ingredientes todavía</p>
          )}
          {ingredients.map((ing, i) => {
            const food = foodMap.get(ing.foodId);
            if (!food) return null;
            const kcal = Math.round(food.kcalPer100g * ing.grams / 100);
            return (
              <div key={i} className="flex items-center gap-2 bg-slate-900 rounded-xl px-2.5 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{food.name}</div>
                  <div className="text-xs text-slate-500">{kcal} kcal</div>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  value={ing.grams}
                  onChange={e => updateGrams(i, parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1 text-sm text-center outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-600">g</span>
                <button
                  onClick={() => removeIngredient(i)}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Añadir ingrediente */}
        {!showFoodSearch ? (
          <button
            onClick={() => setShowFoodSearch(true)}
            className="shrink-0 flex items-center justify-center gap-2 border border-dashed border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 py-2 rounded-xl text-sm transition-colors"
          >
            <Plus size={14} /> Añadir ingrediente
          </button>
        ) : !pendingFood ? (
          /* Búsqueda de alimento */
          <div className="shrink-0 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar alimento..."
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2 text-sm outline-none"
              />
            </div>
            <ul className="max-h-36 overflow-y-auto space-y-0.5">
              {filteredFoods.slice(0, 20).map(food => (
                <li key={food.id}>
                  <button
                    onClick={() => { setPendingFood(food); setPendingGrams('100'); }}
                    className="w-full text-left bg-slate-900 hover:bg-slate-700 rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    <span className="font-medium">{food.name}</span>
                    <span className="text-slate-500 ml-2 text-xs">{food.kcalPer100g} kcal/100g</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => { setShowFoodSearch(false); setSearchQuery(''); }}
              className="w-full text-slate-500 text-xs py-1"
            >
              Cancelar
            </button>
          </div>
        ) : (
          /* Introducir gramos */
          <div className="shrink-0 space-y-2">
            <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2">
              <span className="flex-1 text-sm font-medium truncate">{pendingFood.name}</span>
              <input
                type="number"
                inputMode="decimal"
                value={pendingGrams}
                onChange={e => setPendingGrams(e.target.value)}
                autoFocus
                className="w-20 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-500">g</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingFood(null)}
                className="flex-1 bg-slate-700 py-2 rounded-xl text-sm"
              >
                ← Volver
              </button>
              <button
                onClick={confirmFood}
                disabled={!parseFloat(pendingGrams) || parseFloat(pendingGrams) <= 0}
                className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-500 text-slate-900 font-semibold py-2 rounded-xl text-sm disabled:opacity-50"
              >
                <Check size={14} /> Añadir
              </button>
            </div>
          </div>
        )}

        {/* Guardar / Cancelar */}
        <div className="flex gap-2 shrink-0 pt-1 border-t border-slate-700/40">
          <button onClick={onCancel} className="flex-1 bg-slate-700 py-2.5 rounded-xl text-sm">
            Cancelar
          </button>
          <button
            disabled={!name.trim() || ingredients.length === 0}
            onClick={() => onSave({ name: name.trim(), ingredients })}
            className="flex-1 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl disabled:opacity-50 text-sm"
          >
            Guardar receta
          </button>
        </div>
      </div>
    </div>
  );
}
