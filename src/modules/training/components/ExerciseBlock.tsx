import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, X, Check, Plus, Info, TrendingUp, BarChart2, ArrowUp, ArrowDown } from 'lucide-react';
import type { ExerciseEntry, SetEntry, SetType, Exercise, Session } from '../../../types';
import { SET_TYPE_META, SET_TYPES_ORDERED, roundTo2_5 } from '../constants';
import SetTypeBadge from './SetTypeBadge';
import { uid } from '../../../lib/id';
import { findPreviousWeekEntry, setBeatsPrevious, topEffectiveSet } from '../utils/progression';

interface Props {
  entry: ExerciseEntry;
  exercise: Exercise | undefined;
  sessions: Session[];
  currentDate: string;
  onUpdate: (next: ExerciseEntry) => void;
  onRemove: () => void;
  onStartRest: (seconds: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export default function ExerciseBlock({
  entry, exercise, sessions, currentDate, onUpdate, onRemove, onStartRest, onMoveUp, onMoveDown,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [tooltip, setTooltip] = useState<SetType | null>(null);

  const prev = useMemo(
    () => exercise ? findPreviousWeekEntry(sessions, currentDate, exercise.id) : null,
    [exercise, sessions, currentDate],
  );
  const prevTop = useMemo(() => prev ? topEffectiveSet(prev.entry) : null, [prev]);
  const currentTop = useMemo(() => topEffectiveSet(entry), [entry]);

  const beatsLastWeek = !!(prevTop && currentTop && (
    currentTop.weight > prevTop.weight ||
    (currentTop.weight === prevTop.weight && currentTop.reps > prevTop.reps)
  ));

  // ── Confirmación inteligente al borrar ─────────────────────────────────────
  // Solo pide confirmación si hay sets ya completados — si está vacío, borra directo.
  function handleRemove() {
    const hasDoneSets = entry.sets.some(s => s.done);
    if (hasDoneSets) {
      const ok = confirm(
        `¿Seguro que quieres quitar "${exercise?.name ?? 'este ejercicio'}" de la rutina?\n\nTiene series ya completadas que se perderán.`
      );
      if (!ok) return;
    }
    onRemove();
  }

  // ── Añadir serie ──────────────────────────────────────────────────────────
  function addSet(type: SetType) {
    const lastSimilar = [...entry.sets].reverse().find(s => s.type === type);
    const newSet: SetEntry = {
      id: uid(), type,
      weight: lastSimilar?.weight ?? 0,
      reps: lastSimilar?.reps ?? 0,
      done: false,
    };
    onUpdate({ ...entry, sets: [...entry.sets, newSet] });
  }

  // ── Auto-cálculo BO/BO2 cuando cambia el peso ──────────────────────────────
  // Lógica:
  //   BO  = TS × 0.80  → redondeado al múltiplo de 2.5 kg más cercano
  //   BO2 = BO × 0.80  → redondeado igual
  // Solo rellena si el campo destino aún vale 0 (no editado manualmente).
  function handleWeightChange(changedSet: SetEntry, newWeight: number) {
    let updatedSets = entry.sets.map(s =>
      s.id === changedSet.id ? { ...s, weight: newWeight } : s
    );

    // Cuando cambia el TS, recalcula siempre BO y BO2 no completados.
    // Ya no usamos "=== 0" como guarda: si el usuario cambia el TS de 100→120 kg
    // los BO/BO2 se actualizan solos. Una vez marcados como "done" quedan bloqueados.
    if (changedSet.type === 'topset' && newWeight > 0) {
      const boWeight  = roundTo2_5(newWeight * 0.80);
      const bo2Weight = roundTo2_5(boWeight  * 0.80);
      updatedSets = updatedSets.map(s => {
        if (s.type === 'backoff'  && !s.done) return { ...s, weight: boWeight };
        if (s.type === 'backoff2' && !s.done) return { ...s, weight: bo2Weight };
        return s;
      });
    }

    if (changedSet.type === 'backoff' && newWeight > 0) {
      const bo2Weight = roundTo2_5(newWeight * 0.80);
      updatedSets = updatedSets.map(s => {
        if (s.type === 'backoff2' && !s.done) return { ...s, weight: bo2Weight };
        return s;
      });
    }

    onUpdate({ ...entry, sets: updatedSets });
  }

  function updateSet(id: string, patch: Partial<SetEntry>) {
    onUpdate({ ...entry, sets: entry.sets.map(s => s.id === id ? { ...s, ...patch } : s) });
  }

  function removeSet(id: string) {
    onUpdate({ ...entry, sets: entry.sets.filter(s => s.id !== id) });
  }

  function toggleDone(s: SetEntry) {
    const becomingDone = !s.done;
    updateSet(s.id, { done: becomingDone });
    if (becomingDone) onStartRest(SET_TYPE_META[s.type].defaultRestSec);
  }

  const doneCount = entry.sets.filter(s => s.done).length;

  return (
    <section className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700/40">
      {/* Header */}
      <header className="flex items-center px-3 py-2.5 gap-2">
        <button onClick={() => setExpanded(e => !e)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
          {expanded
            ? <ChevronUp size={16} className="text-slate-500 shrink-0" />
            : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
          <div className="min-w-0">
            <div className="font-semibold truncate">{exercise?.name ?? '(ejercicio eliminado)'}</div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{doneCount}/{entry.sets.length} series</span>
              {beatsLastWeek && (
                <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  ↑ Supera semana pasada
                </span>
              )}
            </div>
          </div>
        </button>
        {/* Botones reordenar */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 disabled:cursor-default transition-colors p-0.5"
              aria-label="Mover arriba"
            >
              <ArrowUp size={13} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className="text-slate-500 hover:text-cyan-400 disabled:opacity-20 disabled:cursor-default transition-colors p-0.5"
              aria-label="Mover abajo"
            >
              <ArrowDown size={13} />
            </button>
          </div>
        )}
        <button
          onClick={handleRemove}
          className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
          aria-label="Quitar ejercicio"
        >
          <X size={16} />
        </button>
      </header>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-700/40 pt-2">
          {/* Referencia semana pasada */}
          {prevTop && (
            <div className="text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <BarChart2 size={12} className="text-slate-500 shrink-0" />
              Sem. pasada (top):
              <span className="font-mono font-medium text-slate-300 ml-1">
                {prevTop.weight} kg × {prevTop.reps} reps
              </span>
            </div>
          )}

          {/* Filas de series */}
          {entry.sets.map((s, i) => (
            <SetRow
              key={s.id}
              index={i + 1}
              set={s}
              beatsPrev={setBeatsPrevious(s, prevTop)}
              onChange={patch => {
                if ('weight' in patch) {
                  handleWeightChange(s, patch.weight as number);
                } else {
                  updateSet(s.id, patch);
                }
              }}
              onRemove={() => removeSet(s.id)}
              onToggleDone={() => toggleDone(s)}
            />
          ))}

          {/* Botones añadir serie */}
          <div className="pt-1 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Añadir serie</p>
            <div className="flex flex-wrap gap-1.5">
              {SET_TYPES_ORDERED.map(t => (
                <div key={t} className="relative">
                  <button
                    onClick={() => addSet(t)}
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${SET_TYPE_META[t].color} opacity-80 active:opacity-100`}
                  >
                    <Plus size={11} />
                    {SET_TYPE_META[t].short}
                  </button>
                  {/* Botón info para N y P — muestra tooltip con descripción */}
                  <button
                    onClick={() => setTooltip(tooltip === t ? null : t)}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-slate-600 rounded-full flex items-center justify-center"
                    aria-label={`Info sobre ${SET_TYPE_META[t].label}`}
                  >
                    <Info size={8} className="text-slate-300" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tooltip descripción del tipo seleccionado */}
            {tooltip && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold px-2 py-0.5 rounded ${SET_TYPE_META[tooltip].color}`}>
                    {SET_TYPE_META[tooltip].short}
                  </span>
                  <span className="font-semibold">{SET_TYPE_META[tooltip].label}</span>
                  <span className="ml-auto text-slate-500">{SET_TYPE_META[tooltip].rirTarget}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{SET_TYPE_META[tooltip].description}</p>
                {(tooltip === 'backoff' || tooltip === 'backoff2') && (
                  <p className="text-cyan-400 text-[10px]">
                    💡 El peso se calcula automáticamente al escribir el Top Set
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notas del ejercicio */}
          <textarea
            value={entry.notes ?? ''}
            onChange={e => onUpdate({ ...entry, notes: e.target.value })}
            placeholder="Notas del ejercicio..."
            rows={1}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-sm text-slate-300 placeholder:text-slate-600 resize-none outline-none"
          />
        </div>
      )}
    </section>
  );
}

// ─── Fila de serie ─────────────────────────────────────────────────────────────

interface SetRowProps {
  index: number;
  set: SetEntry;
  beatsPrev: boolean;
  onChange: (patch: Partial<SetEntry>) => void;
  onRemove: () => void;
  onToggleDone: () => void;
}

function SetRow({ index, set, beatsPrev, onChange, onRemove, onToggleDone }: SetRowProps) {
  // Indicador de peso auto-calculado: muestra "calc" si el set es BO/BO2 y tiene peso > 0
  // pero aún no fue marcado como done (puede haber sido auto-rellenado).
  const isAutoCalc = (set.type === 'backoff' || set.type === 'backoff2') && set.weight > 0 && !set.done;

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
      set.done ? 'bg-slate-900/80' : 'bg-slate-900/30'
    }`}>
      <span className="text-slate-600 text-xs w-4 text-center">{index}</span>

      <SetTypeBadge type={set.type} />

      <div className="flex items-center gap-1.5 flex-1">
        {/* Input peso */}
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            value={set.weight || ''}
            onChange={e => onChange({ weight: parseFloat(e.target.value) || 0 })}
            placeholder="kg"
            className={`w-16 bg-slate-800 border rounded-md px-1.5 py-1 text-sm text-center focus:border-cyan-500 outline-none ${
              isAutoCalc ? 'border-amber-500/60 text-amber-300' : 'border-slate-700/60'
            }`}
          />
          {isAutoCalc && (
            <span
              className="absolute -top-1.5 -right-1 text-[8px] bg-amber-500 text-slate-900 font-bold px-0.5 rounded"
              title="Peso calculado automáticamente (80% del TS/BO anterior). Puedes editarlo."
            >calc</span>
          )}
        </div>

        <span className="text-slate-600 text-xs">×</span>

        {/* Input reps */}
        <input
          type="number"
          inputMode="numeric"
          value={set.reps || ''}
          onChange={e => onChange({ reps: parseInt(e.target.value) || 0 })}
          placeholder="reps"
          className="w-14 bg-slate-800 border border-slate-700/60 rounded-md px-1.5 py-1 text-sm text-center focus:border-cyan-500 outline-none"
        />

        {beatsPrev && (
          <span title="Supera semana pasada">
            <TrendingUp size={14} className="text-green-400 shrink-0" />
          </span>
        )}
      </div>

      {/* Botón done */}
      <button
        onClick={onToggleDone}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          set.done
            ? 'bg-green-500 text-slate-900'
            : 'bg-slate-700 text-slate-500 hover:text-slate-300'
        }`}
        aria-label="Marcar como hecho"
      >
        <Check size={14} strokeWidth={2.5} />
      </button>

      <button
        onClick={onRemove}
        className="text-slate-600 hover:text-red-400 transition-colors p-0.5"
        aria-label="Eliminar serie"
      >
        <X size={13} />
      </button>
    </div>
  );
}
