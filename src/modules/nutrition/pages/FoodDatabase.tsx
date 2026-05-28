import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, UtensilsCrossed } from 'lucide-react';
import type { Food } from '../../../types';
import { useNutritionData } from '../NutritionDataContext';
import { uid } from '../../../lib/id';

// Base de datos de alimentos. CRUD completo.
// Los macros se expresan por 100g — el cálculo real usa los gramos consumidos.
export default function FoodDatabase() {
  const { foods, setFoods } = useNutritionData();
  const [editing, setEditing] = useState<Food | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = foods
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function handleSave(data: Omit<Food, 'id'>) {
    if (editing) {
      setFoods(fs => fs.map(f => f.id === editing.id ? { ...f, ...data } : f));
    } else {
      setFoods(fs => [...fs, { id: uid(), ...data }]);
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(food: Food) {
    if (!confirm(`¿Eliminar "${food.name}"?`)) return;
    setFoods(fs => fs.filter(f => f.id !== food.id));
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={22} className="text-cyan-400" />
          <h1 className="text-2xl font-bold">Alimentos</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-cyan-500 text-slate-900 font-semibold px-3 py-1.5 rounded-xl text-sm"
        >
          <Plus size={16} /> Nuevo
        </button>
      </header>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar alimento..."
          className="w-full bg-slate-800 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
        />
      </div>

      {/* Lista */}
      <ul className="space-y-2">
        {filtered.map(food => (
          <li key={food.id} className="bg-slate-800 border border-slate-700/40 rounded-xl px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{food.name}</div>
                {/* Macros en chip-tags pequeñas */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <MacroChip label="kcal" value={food.kcalPer100g} color="text-orange-400" />
                  <MacroChip label="P" value={food.proteinPer100g} color="text-blue-400" />
                  <MacroChip label="C" value={food.carbsPer100g} color="text-yellow-400" />
                  <MacroChip label="G" value={food.fatPer100g} color="text-pink-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditing(food); setShowForm(true); }}
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(food)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-center text-slate-500 py-10 text-sm">
            Sin resultados.
          </li>
        )}
      </ul>

      {showForm && (
        <FoodForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="text-[10px] bg-slate-900 rounded px-1.5 py-0.5">
      <span className={`font-bold ${color}`}>{label} </span>
      <span className="text-slate-300">{value}g</span>
    </span>
  );
}

interface FormProps {
  initial: Food | null;
  onSave: (data: Omit<Food, 'id'>) => void;
  onCancel: () => void;
}

function FoodForm({ initial, onSave, onCancel }: FormProps) {
  const [name,    setName]    = useState(initial?.name ?? '');
  const [kcal,    setKcal]    = useState(initial?.kcalPer100g    ?? 0);
  const [protein, setProtein] = useState(initial?.proteinPer100g ?? 0);
  const [carbs,   setCarbs]   = useState(initial?.carbsPer100g   ?? 0);
  const [fat,     setFat]     = useState(initial?.fatPer100g     ?? 0);

  const valid = name.trim() && kcal >= 0 && protein >= 0 && carbs >= 0 && fat >= 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-40 px-4 pb-20" onClick={onCancel}>
      <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold">
          {initial ? 'Editar alimento' : 'Nuevo alimento'}
        </h2>
        <p className="text-xs text-slate-400">Valores por 100 g</p>

        <label className="block text-sm">
          <span className="text-slate-400">Nombre</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Pechuga de pollo"
            autoFocus
            className="mt-1 w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <NumField label="Calorías (kcal)" value={kcal} onChange={setKcal} />
          <NumField label="Proteína (g)" value={protein} onChange={setProtein} />
          <NumField label="Carbohidratos (g)" value={carbs} onChange={setCarbs} />
          <NumField label="Grasas (g)" value={fat} onChange={setFat} />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} className="flex-1 bg-slate-700 py-2.5 rounded-xl text-sm">
            Cancelar
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave({ name: name.trim(), kcalPer100g: kcal, proteinPer100g: protein, carbsPer100g: carbs, fatPer100g: fat })}
            className="flex-1 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block text-xs">
      <span className="text-slate-400">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        className="mt-1 w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 outline-none focus:border-cyan-500"
      />
    </label>
  );
}
