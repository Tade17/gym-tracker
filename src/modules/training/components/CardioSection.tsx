import { useState } from 'react';
import { Plus, Trash2, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import type { CardioEntry } from '../../../types';
import { CARDIO_TYPES } from '../constants';
import { uid } from '../../../lib/id';

interface Props {
  cardio: CardioEntry[];
  onChange: (next: CardioEntry[]) => void;
}

// Sección de cardio al final de la sesión.
// Permite registrar una o varias actividades con tipo y duración en minutos.
export default function CardioSection({ cardio, onChange }: Props) {
  const [expanded, setExpanded] = useState(cardio.length > 0);
  const [type,     setType]     = useState<string>(CARDIO_TYPES[0]);
  const [minutes,  setMinutes]  = useState('');
  const [notes,    setNotes]    = useState('');

  function addEntry() {
    const min = parseInt(minutes);
    if (!min || min <= 0) return;
    const entry: CardioEntry = { id: uid(), type, durationMin: min, notes: notes.trim() || undefined };
    onChange([...cardio, entry]);
    setMinutes('');
    setNotes('');
  }

  function removeEntry(id: string) {
    onChange(cardio.filter(c => c.id !== id));
  }

  const totalMin = cardio.reduce((acc, c) => acc + c.durationMin, 0);

  return (
    <section className="bg-slate-800 border border-slate-700/40 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Timer size={15} className="text-cyan-400" />
          <span className="font-medium text-sm">Cardio final</span>
          {cardio.length > 0 && (
            <span className="text-xs bg-cyan-500/20 text-cyan-400 rounded px-1.5 py-0.5 font-medium">
              {totalMin} min
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp size={15} className="text-slate-500" />
          : <ChevronDown size={15} className="text-slate-500" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-700/40 pt-3 space-y-3">
          {/* Entradas existentes */}
          {cardio.length > 0 && (
            <ul className="space-y-1.5">
              {cardio.map(c => (
                <li key={c.id} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-2.5 py-2">
                  <div>
                    <div className="text-sm font-medium">{c.type}</div>
                    <div className="text-xs text-slate-400">
                      {c.durationMin} min{c.notes ? ` · ${c.notes}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(c.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Formulario de nueva entrada */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-2.5 py-2 text-sm outline-none"
              >
                {CARDIO_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  placeholder="min"
                  className="w-20 bg-slate-900 border border-slate-700/60 rounded-xl px-2.5 py-2 text-sm text-center outline-none focus:border-cyan-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">min</span>
              </div>
            </div>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas (velocidad, nivel, pulsaciones...)"
              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-2.5 py-2 text-sm outline-none"
            />
            <button
              onClick={addEntry}
              disabled={!minutes || parseInt(minutes) <= 0}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> Añadir cardio
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
