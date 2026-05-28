import { useState } from 'react';
import { Plus, Pencil, Trash2, Filter, Dumbbell, RotateCcw } from 'lucide-react';
import type { Exercise, MuscleGroup } from '../../../types';
import { MUSCLE_GROUPS, MUSCLE_LABEL } from '../constants';
import { useTrainingData, BASE_EXERCISES } from '../TrainingDataContext';
import { uid } from '../../../lib/id';

export default function ExerciseLibrary() {
  const { exercises, setExercises, sessions } = useTrainingData();
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<MuscleGroup | 'todos'>('todos');

  const filtered = exercises
    .filter(e => filter === 'todos' || e.muscleGroup === filter)
    .sort((a, b) => a.name.localeCompare(b.name));

  function handleSave(data: Omit<Exercise, 'id'>) {
    if (editing) {
      setExercises(exs => exs.map(e => e.id === editing.id ? { ...e, ...data } : e));
    } else {
      setExercises(exs => [...exs, { id: uid(), ...data }]);
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(ex: Exercise) {
    const inUse = sessions.some(s => s.exercises.some(e => e.exerciseId === ex.id));
    const msg = inUse
      ? `"${ex.name}" tiene sesiones registradas. Si lo eliminas esas entradas perderán su nombre. ¿Continuar?`
      : `¿Eliminar "${ex.name}"?`;
    if (!confirm(msg)) return;
    setExercises(exs => exs.filter(e => e.id !== ex.id));
  }

  // Fusiona los ejercicios base con los existentes, añadiendo solo los que faltan
  // (comparación por nombre normalizado). No borra nada — tus ejercicios personalizados
  // se mantienen intactos.
  function handleRestoreBase() {
    const existingNames = new Set(exercises.map(e => e.name.trim().toLowerCase()));
    const missing = BASE_EXERCISES.filter(
      b => !existingNames.has(b.name.trim().toLowerCase())
    );
    if (missing.length === 0) {
      alert('Ya tienes todos los ejercicios base. No hay nada que restaurar.');
      return;
    }
    if (!confirm(`Se añadirán ${missing.length} ejercicios que no tenías. Tus ejercicios personalizados no se borran. ¿Continuar?`)) return;
    // Creamos nuevos IDs para evitar colisiones con los ya existentes.
    setExercises(exs => [
      ...exs,
      ...missing.map(b => ({ ...b, id: uid() })),
    ]);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={22} className="text-cyan-400" />
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">
            {exercises.length}
          </span>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-cyan-500 text-slate-900 font-semibold px-3 py-1.5 rounded-xl text-sm"
        >
          <Plus size={16} /> Nuevo
        </button>
      </header>

      {/* Info para usuario nuevo */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 text-xs text-slate-400 leading-relaxed">
        Puedes <strong className="text-slate-300">agregar tus propios ejercicios</strong> con el botón "Nuevo". Si instalaste la app recientemente, usa{' '}
        <button
          onClick={handleRestoreBase}
          className="text-cyan-400 underline underline-offset-2"
        >
          Restaurar base
        </button>
        {' '}para obtener la biblioteca completa de ~55 ejercicios.
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-slate-500 shrink-0" />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as MuscleGroup | 'todos')}
          className="flex-1 bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="todos">Todos los grupos</option>
          {MUSCLE_GROUPS.map(g => (
            <option key={g} value={g}>{MUSCLE_LABEL[g]}</option>
          ))}
        </select>
        <button
          onClick={handleRestoreBase}
          title="Restaurar ejercicios base sin borrar los tuyos"
          className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-2 rounded-xl text-xs transition-colors"
        >
          <RotateCcw size={13} /> Restaurar base
        </button>
      </div>

      <ul className="space-y-2">
        {filtered.map(ex => (
          <li key={ex.id} className="bg-slate-800 border border-slate-700/40 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{ex.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{MUSCLE_LABEL[ex.muscleGroup]}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditing(ex); setShowForm(true); }}
                className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                aria-label="Editar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(ex)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                aria-label="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-center text-slate-500 py-10 text-sm">
            Sin ejercicios en esta categoría.
          </li>
        )}
      </ul>

      {showForm && (
        <ExerciseForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ─── Formulario ───────────────────────────────────────────────────────────────

interface FormProps {
  initial: Exercise | null;
  onSave: (data: Omit<Exercise, 'id'>) => void;
  onCancel: () => void;
}

function ExerciseForm({ initial, onSave, onCancel }: FormProps) {
  const [name,        setName]        = useState(initial?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(initial?.muscleGroup ?? 'pecho');
  const [notes,       setNotes]       = useState(initial?.notes ?? '');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-40 px-4 pb-20" onClick={onCancel}>
      <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold">
          {initial ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        </h2>

        <label className="block text-sm">
          <span className="text-slate-400">Nombre</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Press con mancuernas inclinado"
            className="mt-1 field-input"
            autoFocus
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-400">Grupo muscular</span>
          <select
            value={muscleGroup}
            onChange={e => setMuscleGroup(e.target.value as MuscleGroup)}
            className="mt-1 field-input"
          >
            {MUSCLE_GROUPS.map(g => (
              <option key={g} value={g}>{MUSCLE_LABEL[g]}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-slate-400">Notas (opcional)</span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Banco a 30°, agarre neutro..."
            rows={2}
            className="mt-1 field-input resize-none"
          />
        </label>

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} className="flex-1 bg-slate-700 py-2.5 rounded-xl text-sm">
            Cancelar
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), muscleGroup, notes: notes.trim() || undefined })}
            className="flex-1 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
