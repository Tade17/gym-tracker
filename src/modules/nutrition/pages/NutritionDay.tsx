import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Dumbbell, Bed,
  Plus, Trash2, Search, UtensilsCrossed, Zap,
  ChefHat, ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';
import type { DayLog, Meal, FoodEntry, MealCategory, RecipeUse } from '../../../types';
import { useNutritionData } from '../NutritionDataContext';
import { useTrainingData } from '../../training/TrainingDataContext';
import { formatShortDate, toISODate, addDays } from '../../../lib/date';
import { uid } from '../../../lib/id';
import { calcDay, calcMeal, calcEntry, calcRecipeUse, fmt } from '../utils/macros';
import MacroBar from '../components/MacroBar';
import { MEAL_CATEGORIES, MEAL_LABEL } from '../constants';

export default function NutritionDay() {
  const { date: dateParam } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const date = dateParam ?? toISODate();
  const isToday = date === toISODate();

  const { foods, dayLogs, setDayLogs, goals, recipes } = useNutritionData();
  const { sessions } = useTrainingData();

  const hasTrainingSession = useMemo(
    () => sessions.some(s => s.date === date),
    [sessions, date],
  );

  const log = useMemo(() => dayLogs.find(l => l.date === date), [dayLogs, date]);
  const isTrainingDay = log?.isTrainingDay ?? hasTrainingSession;
  const activeGoal    = isTrainingDay ? goals.trainingDay : goals.restDay;

  const foodMap   = useMemo(() => new Map(foods.map(f   => [f.id, f])),   [foods]);
  const recipeMap = useMemo(() => new Map(recipes.map(r => [r.id, r])), [recipes]);

  const totals = useMemo(
    () => log
      ? calcDay(log, foodMap, recipeMap)
      : { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    [log, foodMap, recipeMap],
  );

  // ─── Mutaciones del log ─────────────────────────────────────────────────────

  function updateLog(updater: (current: DayLog) => DayLog) {
    setDayLogs(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) return prev.map(l => l.date === date ? updater(l) : l);
      const fresh: DayLog = {
        id: uid(), date,
        meals: MEAL_CATEGORIES.map(c => ({ category: c, entries: [] })),
        isTrainingDay: hasTrainingSession,
      };
      return [...prev, updater(fresh)];
    });
  }

  function toggleTrainingDay() {
    updateLog(l => ({ ...l, isTrainingDay: !l.isTrainingDay }));
  }

  function setDayType(isTraining: boolean) {
    updateLog(l => ({ ...l, isTrainingDay: isTraining }));
  }

  function addEntry(category: MealCategory, foodId: string, grams: number) {
    const entry: FoodEntry = { id: uid(), foodId, grams };
    updateLog(l => ({
      ...l,
      meals: l.meals.map(m =>
        m.category === category ? { ...m, entries: [...m.entries, entry] } : m,
      ),
    }));
  }

  function removeEntry(category: MealCategory, entryId: string) {
    updateLog(l => ({
      ...l,
      meals: l.meals.map(m =>
        m.category === category
          ? { ...m, entries: m.entries.filter(e => e.id !== entryId) }
          : m,
      ),
    }));
  }

  function addRecipeUse(category: MealCategory, recipeId: string, portionPct: number) {
    const use: RecipeUse = { id: uid(), recipeId, mealCategory: category, portionPct };
    updateLog(l => ({ ...l, recipeUses: [...(l.recipeUses ?? []), use] }));
  }

  function removeRecipeUse(useId: string) {
    updateLog(l => ({
      ...l,
      recipeUses: (l.recipeUses ?? []).filter(u => u.id !== useId),
    }));
  }

  // ─── Estado de modales ──────────────────────────────────────────────────────
  const [pickerCategory,       setPickerCategory]       = useState<MealCategory | null>(null);
  const [recipePickerCategory, setRecipePickerCategory] = useState<MealCategory | null>(null);

  return (
    <div className="space-y-3 pb-4">
      {/* Navegación de fechas */}
      <header className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(`/nutricion/${addDays(date, -1)}`)}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wide">{formatShortDate(date)}</div>
          <div className="text-base font-bold mt-0.5">Nutrición</div>
        </div>
        <button
          onClick={() => navigate(`/nutricion/${addDays(date, 1)}`)}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </header>

      {/* Banner "¿Hoy entrenas?" — solo cuando es hoy y no hay log todavía */}
      {isToday && !log && (
        <DayTypePrompt
          trainingGoal={goals.trainingDay}
          restGoal={goals.restDay}
          onConfirm={setDayType}
        />
      )}

      {/* Toggle día de entreno / descanso (visible siempre) */}
      <button
        onClick={toggleTrainingDay}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${
          isTrainingDay
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            : 'bg-slate-800 text-slate-400 border border-slate-700/40'
        }`}
      >
        {isTrainingDay
          ? <><Dumbbell size={15} /> Día de entrenamiento · {goals.trainingDay.kcal} kcal</>
          : <><Bed size={15} /> Día de descanso · {goals.restDay.kcal} kcal</>}
      </button>

      {/* Resumen de macros */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Resumen del día</h2>
          <span className="text-xs text-slate-400">
            <span className={totals.kcal > activeGoal.kcal ? 'text-red-400' : 'text-orange-400'}>
              {Math.round(totals.kcal)}
            </span>
            {' / '}{activeGoal.kcal} kcal
          </span>
        </div>
        <MacroBar label="Calorías" current={totals.kcal}    target={activeGoal.kcal}    unit=" kcal" colorKey="kcal" />
        <MacroBar label="Proteína" current={totals.protein} target={activeGoal.protein} colorKey="protein" />
        <MacroBar label="Carbos"   current={totals.carbs}   target={activeGoal.carbs}   colorKey="carbs" />
        <MacroBar label="Grasas"   current={totals.fat}     target={activeGoal.fat}     colorKey="fat" />
      </section>

      {/* Secciones de comidas */}
      {MEAL_CATEGORIES.map(category => {
        const meal = log?.meals.find(m => m.category === category)
          ?? { category, entries: [] };
        const categoryRecipeUses = (log?.recipeUses ?? []).filter(
          u => u.mealCategory === category,
        );
        return (
          <MealSection
            key={category}
            meal={meal}
            foodMap={foodMap}
            recipeMap={recipeMap}
            recipeUses={categoryRecipeUses}
            onAddEntry={() => setPickerCategory(category)}
            onAddRecipe={() => setRecipePickerCategory(category)}
            onRemoveEntry={entryId => removeEntry(category, entryId)}
            onRemoveRecipeUse={removeRecipeUse}
          />
        );
      })}

      {/* Links de gestión */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        <Link to="/recetas"   className="flex items-center gap-1 hover:text-slate-300 transition-colors py-2">
          <ChefHat size={13} /> Gestionar recetas
        </Link>
        <span className="text-slate-700">·</span>
        <Link to="/alimentos" className="flex items-center gap-1 hover:text-slate-300 transition-colors py-2">
          <UtensilsCrossed size={13} /> Base de alimentos
        </Link>
      </div>

      {/* Modal picker de alimentos */}
      {pickerCategory && (
        <FoodPicker
          foods={foods}
          category={pickerCategory}
          onAdd={(foodId, grams) => {
            addEntry(pickerCategory, foodId, grams);
            setPickerCategory(null);
          }}
          onClose={() => setPickerCategory(null)}
        />
      )}

      {/* Modal picker de recetas */}
      {recipePickerCategory && (
        <RecipePicker
          recipes={recipes}
          foodMap={foodMap}
          category={recipePickerCategory}
          onAdd={(recipeId, pct) => {
            addRecipeUse(recipePickerCategory, recipeId, pct);
            setRecipePickerCategory(null);
          }}
          onClose={() => setRecipePickerCategory(null)}
        />
      )}
    </div>
  );
}

// ─── DayTypePrompt ────────────────────────────────────────────────────────────

function DayTypePrompt({ trainingGoal, restGoal, onConfirm }: {
  trainingGoal: { kcal: number; protein: number };
  restGoal:     { kcal: number; protein: number };
  onConfirm: (isTraining: boolean) => void;
}) {
  return (
    <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
      <p className="font-semibold text-center text-sm">¿Cómo es tu día de hoy?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onConfirm(true)}
          className="flex flex-col items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 rounded-xl py-3 transition-colors"
        >
          <Dumbbell size={22} className="text-cyan-400" />
          <span className="font-semibold text-sm text-cyan-400">Entreno 💪</span>
          <span className="text-xs text-slate-400">{trainingGoal.kcal} kcal · {trainingGoal.protein}g P</span>
        </button>
        <button
          onClick={() => onConfirm(false)}
          className="flex flex-col items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/40 rounded-xl py-3 transition-colors"
        >
          <Bed size={22} className="text-slate-400" />
          <span className="font-semibold text-sm text-slate-300">Descanso 😴</span>
          <span className="text-xs text-slate-400">{restGoal.kcal} kcal · {restGoal.protein}g P</span>
        </button>
      </div>
    </div>
  );
}

// ─── MealSection ──────────────────────────────────────────────────────────────

const MEAL_ICONS: Record<MealCategory, React.ReactNode> = {
  desayuno:   <span className="text-base">🌅</span>,
  almuerzo:   <UtensilsCrossed size={15} />,
  merienda:   <span className="text-base">🍎</span>,
  preentreno: <Zap size={15} />,
  cena:       <span className="text-base">🌙</span>,
};

function MealSection({ meal, foodMap, recipeMap, recipeUses, onAddEntry, onAddRecipe, onRemoveEntry, onRemoveRecipeUse }: {
  meal: Meal;
  foodMap: Map<string, import('../../../types').Food>;
  recipeMap: Map<string, import('../../../types').Recipe>;
  recipeUses: RecipeUse[];
  onAddEntry: () => void;
  onAddRecipe: () => void;
  onRemoveEntry: (id: string) => void;
  onRemoveRecipeUse: (id: string) => void;
}) {
  const mealTotals = useMemo(() => calcMeal(meal, foodMap), [meal, foodMap]);

  const recipesTotals = useMemo(
    () => recipeUses.reduce(
      (acc, ru) => {
        const r = recipeMap.get(ru.recipeId);
        if (!r) return acc;
        const m = calcRecipeUse(r, foodMap, ru.portionPct);
        return { kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein,
                 carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    ),
    [recipeUses, recipeMap, foodMap],
  );

  const sectionKcal = mealTotals.kcal + recipesTotals.kcal;
  const sectionProt = mealTotals.protein + recipesTotals.protein;
  const hasContent = meal.entries.length > 0 || recipeUses.length > 0;

  return (
    <section className="bg-slate-800 border border-slate-700/40 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/40">
        <div className="flex items-center gap-2 text-slate-300">
          {MEAL_ICONS[meal.category]}
          <span className="font-medium text-sm">{MEAL_LABEL[meal.category]}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasContent && (
            <span className="text-xs text-slate-500">
              {Math.round(sectionKcal)} kcal · {fmt(sectionProt)}g P
            </span>
          )}
          {/* Botón añadir receta */}
          <button
            onClick={onAddRecipe}
            className="flex items-center gap-1 bg-slate-700/60 hover:bg-slate-600 text-slate-300 rounded-lg px-2 py-1 text-xs transition-colors"
            title="Añadir receta"
          >
            <ChefHat size={11} /> Receta
          </button>
          {/* Botón añadir alimento */}
          <button
            onClick={onAddEntry}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg px-2 py-1 text-xs transition-colors"
          >
            <Plus size={12} /> Añadir
          </button>
        </div>
      </div>

      {/* Bloques de receta */}
      {recipeUses.map(ru => (
        <RecipeBlock
          key={ru.id}
          recipeUse={ru}
          recipeMap={recipeMap}
          foodMap={foodMap}
          onRemove={() => onRemoveRecipeUse(ru.id)}
        />
      ))}

      {/* Alimentos individuales */}
      {meal.entries.length > 0 ? (
        <ul className="divide-y divide-slate-700/30">
          {meal.entries.map(entry => {
            const food = foodMap.get(entry.foodId);
            if (!food) return null;
            const m = calcEntry(entry, food);
            return (
              <li key={entry.id} className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{food.name}</div>
                  <div className="text-xs text-slate-500">
                    {entry.grams}g · {Math.round(m.kcal)} kcal · {fmt(m.protein)}g P · {fmt(m.carbs)}g C · {fmt(m.fat)}g G
                  </div>
                </div>
                <button
                  onClick={() => onRemoveEntry(entry.id)}
                  className="ml-2 p-1.5 text-slate-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : !hasContent ? (
        <div className="px-3 py-3 text-xs text-slate-600 italic">Sin alimentos registrados</div>
      ) : null}
    </section>
  );
}

// ─── RecipeBlock ──────────────────────────────────────────────────────────────

function RecipeBlock({ recipeUse, recipeMap, foodMap, onRemove }: {
  recipeUse: RecipeUse;
  recipeMap: Map<string, import('../../../types').Recipe>;
  foodMap:   Map<string, import('../../../types').Food>;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const recipe  = recipeMap.get(recipeUse.recipeId);
  const totals  = useMemo(
    () => recipe ? calcRecipeUse(recipe, foodMap, recipeUse.portionPct) : null,
    [recipe, foodMap, recipeUse.portionPct],
  );

  if (!recipe || !totals) return null;

  return (
    <div className="border-b border-slate-700/30 bg-slate-900/40">
      {/* Cabecera del bloque */}
      <div className="flex items-center px-3 py-2 gap-2">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          <BookOpen size={13} className="text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {recipe.name}
              {recipeUse.portionPct !== 100 && (
                <span className="ml-1.5 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                  {recipeUse.portionPct}%
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {Math.round(totals.kcal)} kcal · {fmt(totals.protein)}g P
            </div>
          </div>
          {expanded ? <ChevronUp size={13} className="text-slate-500 shrink-0 ml-auto" />
                    : <ChevronDown size={13} className="text-slate-500 shrink-0 ml-auto" />}
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-slate-600 hover:text-red-400 transition-colors shrink-0"
          aria-label="Quitar receta"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Ingredientes expandibles */}
      {expanded && (
        <ul className="pb-1">
          {recipe.ingredients.map((ing, i) => {
            const food = foodMap.get(ing.foodId);
            if (!food) return null;
            const scaledGrams = ing.grams * recipeUse.portionPct / 100;
            const kcal = Math.round(food.kcalPer100g * scaledGrams / 100);
            return (
              <li key={i} className="flex items-center justify-between px-5 py-1 text-xs">
                <span className="text-slate-400">{food.name}</span>
                <span className="text-slate-500">{Math.round(scaledGrams)}g · {kcal} kcal</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── RecipePicker modal ───────────────────────────────────────────────────────

const PORTION_PRESETS = [50, 75, 80, 90, 100, 125, 150];

function RecipePicker({ recipes, foodMap, category, onAdd, onClose }: {
  recipes: import('../../../types').Recipe[];
  foodMap: Map<string, import('../../../types').Food>;
  category: MealCategory;
  onAdd: (recipeId: string, portionPct: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected]   = useState<import('../../../types').Recipe | null>(null);
  const [portionPct, setPortionPct] = useState(100);
  const [customPct, setCustomPct]   = useState('');

  const totals = useMemo(
    () => selected ? calcRecipeUse(selected, foodMap, portionPct) : null,
    [selected, foodMap, portionPct],
  );

  function applyCustomPct() {
    const v = parseInt(customPct);
    if (v > 0 && v <= 300) setPortionPct(v);
    setCustomPct('');
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center px-4 pb-20"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-4 w-full max-w-md max-h-[85vh] flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold shrink-0">
          Añadir receta a {MEAL_LABEL[category]}
        </h2>

        {!selected ? (
          /* Paso 1: elegir receta */
          <ul className="overflow-y-auto flex-1 space-y-1.5">
            {recipes.map(recipe => {
              const t = calcRecipeUse(recipe, foodMap, 100);
              return (
                <li key={recipe.id}>
                  <button
                    onClick={() => setSelected(recipe)}
                    className="w-full text-left bg-slate-900 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors"
                  >
                    <div className="font-medium text-sm">{recipe.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      <span className="text-orange-400">{Math.round(t.kcal)} kcal</span>
                      {' · '}{fmt(t.protein)}g P · {fmt(t.carbs)}g C · {fmt(t.fat)}g G
                      {' · '}{recipe.ingredients.length} ingredientes
                    </div>
                  </button>
                </li>
              );
            })}
            {recipes.length === 0 && (
              <li className="text-center text-slate-500 py-6 text-sm">
                Sin recetas. Ve a "Gestionar recetas" para crear una.
              </li>
            )}
          </ul>
        ) : (
          /* Paso 2: ajustar porción */
          <div className="space-y-4 flex-1">
            <div className="bg-slate-900 rounded-xl px-3 py-2.5">
              <div className="font-medium">{selected.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{selected.ingredients.length} ingredientes</div>
            </div>

            {/* Presets de porción */}
            <div>
              <p className="text-xs text-slate-400 mb-2">Porción de la receta</p>
              <div className="flex flex-wrap gap-1.5">
                {PORTION_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPortionPct(p)}
                    className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                      portionPct === p
                        ? 'bg-cyan-500 text-slate-900'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                {/* Input personalizado */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={customPct}
                    onChange={e => setCustomPct(e.target.value)}
                    onBlur={applyCustomPct}
                    onKeyDown={e => e.key === 'Enter' && applyCustomPct()}
                    placeholder="?"
                    className="w-14 bg-slate-700 border border-slate-600/60 rounded-lg px-2 py-1 text-sm text-center outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* Preview macros */}
            {totals && (
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'kcal', value: Math.round(totals.kcal), color: 'text-orange-400' },
                  { label: 'Prot', value: fmt(totals.protein),     color: 'text-blue-400'   },
                  { label: 'Carb', value: fmt(totals.carbs),       color: 'text-yellow-400' },
                  { label: 'Gras', value: fmt(totals.fat),         color: 'text-pink-400'   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-900 rounded-xl py-2">
                    <div className={`text-sm font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 bg-slate-700 py-2.5 rounded-xl text-sm">
                ← Volver
              </button>
              <button
                onClick={() => onAdd(selected.id, portionPct)}
                className="flex-1 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl text-sm"
              >
                Añadir ({portionPct}%)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FoodPicker modal (sin cambios) ──────────────────────────────────────────

function FoodPicker({ foods, category, onAdd, onClose }: {
  foods: import('../../../types').Food[];
  category: MealCategory;
  onAdd: (foodId: string, grams: number) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<import('../../../types').Food | null>(null);
  const [grams, setGrams] = useState('100');

  const filtered = foods
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function confirmAdd() {
    if (!selected) return;
    const g = parseFloat(grams);
    if (!g || g <= 0) return;
    onAdd(selected.id, g);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center px-4 pb-20" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-1">Añadir a {MEAL_LABEL[category]}</h2>

        {!selected ? (
          <>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar alimento..."
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2 text-sm outline-none"
              />
            </div>
            <ul className="overflow-y-auto flex-1 space-y-1">
              {filtered.map(food => (
                <li key={food.id}>
                  <button onClick={() => setSelected(food)} className="w-full text-left bg-slate-900 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors">
                    <div className="font-medium text-sm">{food.name}</div>
                    <div className="text-xs text-slate-400">{food.kcalPer100g} kcal · {food.proteinPer100g}g P · {food.carbsPer100g}g C · {food.fatPer100g}g G · por 100g</div>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="text-center text-slate-500 py-6 text-sm">Sin resultados</li>}
            </ul>
          </>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="bg-slate-900 rounded-xl px-3 py-2.5">
              <div className="font-medium">{selected.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{selected.kcalPer100g} kcal / 100g</div>
            </div>
            <label className="block">
              <span className="text-sm text-slate-400">Cantidad (g)</span>
              <input
                type="number" inputMode="decimal" value={grams}
                onChange={e => setGrams(e.target.value)} autoFocus
                className="mt-1 w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-center text-xl font-mono outline-none focus:border-cyan-500"
              />
            </label>
            {parseFloat(grams) > 0 && (() => {
              const f = parseFloat(grams) / 100;
              return (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'kcal', value: Math.round(selected.kcalPer100g    * f), color: 'text-orange-400' },
                    { label: 'Prot', value: fmt(selected.proteinPer100g * f),         color: 'text-blue-400'   },
                    { label: 'Carb', value: fmt(selected.carbsPer100g   * f),         color: 'text-yellow-400' },
                    { label: 'Gras', value: fmt(selected.fatPer100g     * f),         color: 'text-pink-400'   },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-900 rounded-xl py-2">
                      <div className={`text-sm font-bold ${color}`}>{value}</div>
                      <div className="text-[10px] text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 bg-slate-700 py-2.5 rounded-xl text-sm">← Volver</button>
              <button
                onClick={confirmAdd}
                disabled={!parseFloat(grams) || parseFloat(grams) <= 0}
                className="flex-1 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                Añadir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
