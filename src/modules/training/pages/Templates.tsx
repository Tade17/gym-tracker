import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { Template, TemplateExercise, SetType } from '../../../types';
import { useTrainingData } from '../TrainingDataContext';
import { MUSCLE_LABEL, SET_TYPES_ORDERED, SET_TYPE_META } from '../constants';
import { uid } from '../../../lib/id';

// CRUD de plantillas de rutina. Una plantilla guarda la estructura de una sesión
// (ejercicios + tipos de serie planificados) sin pesos concretos.
export default function Templates() {
  const { templates, setTemplates, exercises } = useTrainingData();
  const [editing, setEditing] = useState<Template | null>(null);

  function startNew() {
    setEditing({ id: uid(), name: '', exercises: [] });
  }

  function save(t: Template) {
    setTemplates(prev => {
      if (prev.some(p => p.id === t.id)) {
        return prev.map(p => p.id === t.id ? t : p);
      }
      return [...prev, t];
    });
    setEditing(null);
  }

  function remove(id: string) {
    if (!confirm('¿Eliminar plantilla?')) return;
    setTemplates(prev => prev.filter(p => p.id !== id));
  }

  if (editing) {
    return (
      <TemplateEditor
        initial={editing}
        exercises={exercises}
        onSave={save}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plantillas</h1>
        <button
          onClick={startNew}
          className="bg-cyan-500 text-slate-900 font-semibold px-3 py-1.5 rounded-lg text-sm"
        >+ Nueva</button>
      </header>

      {templates.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">
          Crea una plantilla para no reescribir los ejercicios cada día.
        </p>
      ) : (
        <ul className="space-y-2">
          {templates.map(t => (
            <li key={t.id} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-400">{t.exercises.length} ejercicios</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(t)}
                  className="text-cyan-400 text-sm px-2"
                >Editar</button>
                <button
                  onClick={() => remove(t.id)}
                  className="text-red-400 text-sm px-2"
                >✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface EditorProps {
  initial: Template;
  exercises: { id: string; name: string; muscleGroup: keyof typeof MUSCLE_LABEL }[];
  onSave: (t: Template) => void;
  onCancel: () => void;
}

function TemplateEditor({ initial, exercises, onSave, onCancel }: EditorProps) {
  const [name, setName] = useState(initial.name);
  const [list, setList] = useState<TemplateExercise[]>(initial.exercises);
  const [showPicker, setShowPicker] = useState(false);

  function addExercise(exerciseId: string) {
    setList(l => [...l, { exerciseId, plannedSets: [] }]);
    setShowPicker(false);
  }

  function removeExerciseAt(idx: number) {
    setList(l => l.filter((_, i) => i !== idx));
  }

  function moveExerciseAt(idx: number, dir: -1 | 1) {
    setList(l => {
      const arr = [...l];
      const [item] = arr.splice(idx, 1);
      arr.splice(idx + dir, 0, item);
      return arr;
    });
  }

  function addSet(idx: number, type: SetType) {
    setList(l => l.map((te, i) =>
      i === idx ? { ...te, plannedSets: [...te.plannedSets, { type }] } : te
    ));
  }

  function removeSet(exIdx: number, setIdx: number) {
    setList(l => l.map((te, i) =>
      i === exIdx ? { ...te, plannedSets: te.plannedSets.filter((_, si) => si !== setIdx) } : te
    ));
  }

  function updateTargetReps(exIdx: number, setIdx: number, reps: number) {
    setList(l => l.map((te, i) =>
      i === exIdx
        ? { ...te, plannedSets: te.plannedSets.map((ps, si) => si === setIdx ? { ...ps, targetReps: reps } : ps) }
        : te
    ));
  }

  function updateRefWeight(exIdx: number, setIdx: number, kg: number) {
    setList(l => l.map((te, i) =>
      i === exIdx
        ? { ...te, plannedSets: te.plannedSets.map((ps, si) => si === setIdx ? { ...ps, referenceWeight: kg || undefined } : ps) }
        : te
    ));
  }

  const exMap = new Map(exercises.map(e => [e.id, e]));

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2">
        <button onClick={onCancel} className="text-slate-400">← Atrás</button>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la plantilla"
          autoFocus
          className="flex-1 text-xl font-bold bg-transparent border-b border-slate-700 outline-none"
        />
      </header>

      <ul className="space-y-2">
        {list.map((te, exIdx) => {
          const ex = exMap.get(te.exerciseId);
          return (
            <li key={exIdx} className="bg-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium flex-1 min-w-0 truncate">{ex?.name ?? '(eliminado)'}</div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveExerciseAt(exIdx, -1)}
                    disabled={exIdx === 0}
                    className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 disabled:cursor-default transition-colors p-1"
                    aria-label="Mover arriba"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => moveExerciseAt(exIdx, 1)}
                    disabled={exIdx === list.length - 1}
                    className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 disabled:cursor-default transition-colors p-1"
                    aria-label="Mover abajo"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button onClick={() => removeExerciseAt(exIdx)} className="text-red-400 hover:text-red-300 transition-colors p-1">✕</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {te.plannedSets.map((ps, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-1 bg-slate-900 rounded-lg px-2 py-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SET_TYPE_META[ps.type].color}`}>
                      {SET_TYPE_META[ps.type].short}
                    </span>
                    {/* Peso de referencia */}
                    <input
                      type="number"
                      inputMode="decimal"
                      value={ps.referenceWeight ?? ''}
                      onChange={e => updateRefWeight(exIdx, setIdx, parseFloat(e.target.value) || 0)}
                      placeholder="kg"
                      className="w-12 bg-slate-800 border border-slate-700/60 rounded text-xs text-center py-0.5 outline-none focus:border-cyan-500"
                    />
                    <span className="text-slate-600 text-[10px]">×</span>
                    {/* Reps objetivo */}
                    <input
                      type="number"
                      inputMode="numeric"
                      value={ps.targetReps ?? ''}
                      onChange={e => updateTargetReps(exIdx, setIdx, parseInt(e.target.value) || 0)}
                      placeholder="reps"
                      className="w-12 bg-slate-800 border border-slate-700/60 rounded text-xs text-center py-0.5 outline-none focus:border-cyan-500"
                    />
                    <button onClick={() => removeSet(exIdx, setIdx)} className="text-slate-500 hover:text-red-400 text-xs pl-0.5">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {SET_TYPES_ORDERED.map(t => (
                  <button
                    key={t}
                    onClick={() => addSet(exIdx, t)}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${SET_TYPE_META[t].color} opacity-70`}
                  >+ {SET_TYPE_META[t].short}</button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        onClick={() => setShowPicker(true)}
        className="w-full bg-slate-700 text-slate-200 py-2 rounded-lg"
      >+ Añadir ejercicio</button>

      <button
        disabled={!name.trim()}
        onClick={() => onSave({ ...initial, name: name.trim(), exercises: list })}
        className="w-full bg-cyan-500 text-slate-900 font-semibold py-2 rounded-lg disabled:opacity-50"
      >Guardar plantilla</button>

      {showPicker && (
        <ExercisePickerModal
          exercises={exercises}
          onPick={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Exercise picker con buscador ─────────────────────────────────────────────

function ExercisePickerModal({ exercises, onPick, onClose }: {
  exercises: { id: string; name: string; muscleGroup: keyof typeof MUSCLE_LABEL }[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = [...exercises]
    .filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center px-4 pb-20"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-4 w-full max-w-md space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">Elegir ejercicio</h2>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm outline-none"
        />
        <ul className="overflow-y-auto max-h-60 space-y-1">
          {filtered.map(ex => (
            <li key={ex.id}>
              <button
                onClick={() => onPick(ex.id)}
                className="w-full text-left bg-slate-900 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors"
              >
                <div className="font-medium text-sm">{ex.name}</div>
                <div className="text-xs text-slate-400">{MUSCLE_LABEL[ex.muscleGroup]}</div>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="text-center text-slate-500 text-sm py-6">
              Sin resultados para "{query}"
            </li>
          )}
        </ul>
        <button onClick={onClose} className="w-full bg-slate-700 py-2.5 rounded-xl text-sm">
          Cancelar
        </button>
      </div>
    </div>
  );
}
