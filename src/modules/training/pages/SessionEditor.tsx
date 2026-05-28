import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, Timer, ChevronLeft, ChevronRight, FileText, Check, Copy } from 'lucide-react';
import type { Session, ExerciseEntry, Template, CardioEntry, MuscleGroup } from '../../../types';
import { useTrainingData } from '../TrainingDataContext';
import { formatShortDate, toISODate, addDays } from '../../../lib/date';
import { uid } from '../../../lib/id';
import ExerciseBlock from '../components/ExerciseBlock';
import RestTimer from '../components/RestTimer';
import CardioSection from '../components/CardioSection';
import { MUSCLE_LABEL, MUSCLE_GROUPS } from '../constants';

export default function SessionEditor() {
  const { date: dateParam } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const date = dateParam ?? toISODate();

  const { exercises, sessions, setSessions, templates } = useTrainingData();
  const session = useMemo(() => sessions.find(s => s.date === date), [sessions, date]);

  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [timerSeconds,       setTimerSeconds]       = useState<number | null>(null);
  const [showPastPicker,     setShowPastPicker]     = useState(false);

  function updateSession(updater: (current: Session) => Session) {
    setSessions(prev => {
      const existing = prev.find(s => s.date === date);
      if (existing) return prev.map(s => s.date === date ? updater(s) : s);
      const fresh: Session = { id: uid(), date, exercises: [] };
      return [...prev, updater(fresh)];
    });
  }

  function addExercise(exerciseId: string) {
    updateSession(s => ({
      ...s,
      exercises: [...s.exercises, { id: uid(), exerciseId, sets: [] }],
    }));
    setShowExercisePicker(false);
  }

  function loadTemplate(t: Template) {
    if (session && session.exercises.length > 0) {
      if (!confirm('Se añadirán los ejercicios de la plantilla. ¿Continuar?')) return;
    }
    const newEntries: ExerciseEntry[] = t.exercises.map(te => ({
      id: uid(),
      exerciseId: te.exerciseId,
      sets: te.plannedSets.map(ps => ({
        id: uid(), type: ps.type,
        weight: ps.referenceWeight ?? 0,
        reps:   ps.targetReps    ?? 0,
        done: false,
      })),
    }));
    updateSession(s => ({ ...s, name: s.name ?? t.name, exercises: [...s.exercises, ...newEntries] }));
    setShowTemplatePicker(false);
  }

  function updateEntry(entryId: string, next: ExerciseEntry) {
    updateSession(s => ({ ...s, exercises: s.exercises.map(e => e.id === entryId ? next : e) }));
  }

  function removeEntry(entryId: string) {
    updateSession(s => ({ ...s, exercises: s.exercises.filter(e => e.id !== entryId) }));
  }

  // Copia una sesión pasada AL día actual (todos los sets se marcan como pendientes).
  function copySessionFrom(sourceSession: Session) {
    const copiedExercises: ExerciseEntry[] = sourceSession.exercises.map(e => ({
      ...e,
      id:   uid(),
      sets: e.sets.map(s => ({ ...s, id: uid(), done: false })),
    }));
    updateSession(s => ({
      ...s,
      name: s.name ?? sourceSession.name,
      exercises: [...s.exercises, ...copiedExercises],
    }));
    setShowPastPicker(false);
  }

  const exMap = useMemo(() => new Map(exercises.map(e => [e.id, e])), [exercises]);

  // Sesiones pasadas con ejercicios (para el picker de copiar rutina)
  const pastSessions = useMemo(
    () => sessions
      .filter(s => s.date < date && s.exercises.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [sessions, date],
  );

  return (
    <div className="space-y-3">
      {/* Navegación entre días */}
      <header className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(`/sesion/${addDays(date, -1)}`)}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Día anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wide">{formatShortDate(date)}</div>
          <input
            value={session?.name ?? ''}
            onChange={e => updateSession(s => ({ ...s, name: e.target.value }))}
            placeholder="Push · Pull · Pierna..."
            className="text-lg font-bold bg-transparent text-center border-b border-transparent focus:border-slate-600 outline-none w-full max-w-[200px]"
          />
        </div>
        <button
          onClick={() => navigate(`/sesion/${addDays(date, 1)}`)}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Día siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </header>

      {!session || session.exercises.length === 0 ? (
        <EmptyState
          hasTemplates={templates.length > 0}
          hasPastSessions={pastSessions.length > 0}
          onPickExercise={() => setShowExercisePicker(true)}
          onPickTemplate={() => setShowTemplatePicker(true)}
          onCopyFromPast={() => setShowPastPicker(true)}
        />
      ) : (
        <div className="space-y-3">
          {session.exercises.map(entry => (
            <ExerciseBlock
              key={entry.id}
              entry={entry}
              exercise={exMap.get(entry.exerciseId)}
              sessions={sessions}
              currentDate={date}
              onUpdate={next => updateEntry(entry.id, next)}
              onRemove={() => removeEntry(entry.id)}
              onStartRest={secs => setTimerSeconds(secs)}
            />
          ))}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowExercisePicker(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-2.5 rounded-xl transition-colors"
            >
              <Plus size={18} /> Ejercicio
            </button>
            {templates.length > 0 && (
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <ClipboardList size={16} /> Plantilla
              </button>
            )}
          </div>

          <CardioSection
            cardio={session.cardio ?? []}
            onChange={(next: CardioEntry[]) => updateSession(s => ({ ...s, cardio: next }))}
          />

          <label className="block">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
              <FileText size={13} /> Notas de la sesión
            </div>
            <textarea
              value={session.notes ?? ''}
              onChange={e => updateSession(s => ({ ...s, notes: e.target.value }))}
              placeholder="Energía, sensaciones, dolor..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-sm placeholder:text-slate-600 resize-none outline-none focus:border-slate-500"
            />
          </label>
        </div>
      )}

      {showExercisePicker && (
        <ExercisePicker
          exercises={exercises}
          onPick={addExercise}
          onClose={() => setShowExercisePicker(false)}
        />
      )}
      {showTemplatePicker && (
        <TemplatePicker
          templates={templates}
          onPick={loadTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      <RestTimer
        isOpen={timerSeconds !== null}
        initialSeconds={timerSeconds ?? 0}
        onClose={() => setTimerSeconds(null)}
      />

      {showPastPicker && (
        <PastSessionPicker
          sessions={pastSessions}
          exMap={exMap}
          onPick={copySessionFrom}
          onClose={() => setShowPastPicker(false)}
        />
      )}

      {/* Botón flotante para abrir timer manualmente */}
      <button
        onClick={() => setTimerSeconds(90)}
        className="fixed right-4 bottom-24 bg-slate-700 hover:bg-slate-600 text-slate-200 w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-colors"
        aria-label="Abrir temporizador"
      >
        <Timer size={20} />
      </button>
    </div>
  );
}

// ─── Componentes locales ──────────────────────────────────────────────────────

function EmptyState({ hasTemplates, hasPastSessions, onPickExercise, onPickTemplate, onCopyFromPast }: {
  hasTemplates: boolean;
  hasPastSessions: boolean;
  onPickExercise: () => void;
  onPickTemplate: () => void;
  onCopyFromPast: () => void;
}) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
        <Plus size={32} className="text-slate-500" />
      </div>
      <div>
        <p className="font-semibold text-slate-300">Sin ejercicios todavía</p>
        <p className="text-sm text-slate-500 mt-1">Añade un ejercicio o carga una plantilla</p>
      </div>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <button
          onClick={onPickExercise}
          className="flex items-center justify-center gap-2 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl"
        >
          <Plus size={18} /> Añadir ejercicio
        </button>
        {hasTemplates && (
          <button
            onClick={onPickTemplate}
            className="flex items-center justify-center gap-2 bg-slate-700 text-slate-200 py-2.5 rounded-xl"
          >
            <ClipboardList size={16} /> Cargar plantilla
          </button>
        )}
        {hasPastSessions && (
          <button
            onClick={onCopyFromPast}
            className="flex items-center justify-center gap-2 border border-dashed border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Copy size={16} /> Copiar rutina anterior
          </button>
        )}
      </div>
    </div>
  );
}

function BottomSheet({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center px-4 pb-20"
      onClick={onClose}
    >
      <div className="bg-slate-800 rounded-2xl p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ExercisePicker({ exercises, onPick, onClose }: {
  exercises: { id: string; name: string; muscleGroup: keyof typeof MUSCLE_LABEL }[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { setExercises } = useTrainingData();
  const [query, setQuery]       = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('pecho');

  const filtered = exercises
    .filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function openCreate(prefill = '') {
    setNewName(prefill);
    setNewGroup('pecho');
    setCreating(true);
  }

  function saveNew() {
    const name = newName.trim();
    if (!name) return;
    const newId = uid();
    setExercises(exs => [...exs, { id: newId, name, muscleGroup: newGroup }]);
    onPick(newId);
  }

  return (
    <BottomSheet title="Elegir ejercicio" onClose={onClose}>
      {!creating ? (
        <>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 mb-3 text-sm outline-none"
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
              <li className="py-4 text-center space-y-2">
                <p className="text-slate-500 text-sm">Sin resultados para "{query}"</p>
                <button
                  onClick={() => openCreate(query)}
                  className="text-cyan-400 text-sm font-medium underline underline-offset-2"
                >
                  + Crear "{query}"
                </button>
              </li>
            )}
          </ul>
          <button
            onClick={() => openCreate('')}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-dashed border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus size={15} /> Crear ejercicio nuevo
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">El ejercicio se guardará en tu biblioteca y se añadirá a la sesión.</p>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre del ejercicio"
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
          />
          <select
            value={newGroup}
            onChange={e => setNewGroup(e.target.value as MuscleGroup)}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm outline-none"
          >
            {MUSCLE_GROUPS.map(g => (
              <option key={g} value={g}>{MUSCLE_LABEL[g]}</option>
            ))}
          </select>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setCreating(false)}
              className="flex-1 bg-slate-700 py-2.5 rounded-xl text-sm"
            >
              Volver
            </button>
            <button
              disabled={!newName.trim()}
              onClick={saveNew}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              <Check size={15} /> Crear y añadir
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function TemplatePicker({ templates, onPick, onClose }: {
  templates: Template[];
  onPick: (t: Template) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet title="Cargar plantilla" onClose={onClose}>
      <ul className="overflow-y-auto max-h-72 space-y-1">
        {templates.map(t => (
          <li key={t.id}>
            <button
              onClick={() => onPick(t)}
              className="w-full text-left bg-slate-900 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors"
            >
              <div className="font-medium text-sm">{t.name}</div>
              <div className="text-xs text-slate-400">{t.exercises.length} ejercicios</div>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

// ─── PastSessionPicker ─────────────────────────────────────────────────────────

function PastSessionPicker({ sessions, exMap, onPick, onClose }: {
  sessions: Session[];
  exMap: Map<string, { id: string; name: string }>;
  onPick: (s: Session) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Session | null>(null);

  // ── Vista de confirmación ──────────────────────────────────────────────────
  if (selected) {
    const names = selected.exercises
      .map(e => exMap.get(e.exerciseId)?.name ?? '(desconocido)')
      .slice(0, 6);

    return (
      <div
        className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center px-4 pb-20"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 rounded-2xl p-4 w-full max-w-md space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <div>
            <p className="text-xs text-cyan-400 uppercase tracking-wide font-medium">
              {formatShortDate(selected.date)}
            </p>
            <h2 className="text-base font-semibold mt-0.5">
              {selected.name || 'Sesión sin nombre'}
            </h2>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Ejercicios que se copiarán:</p>
            <ul className="space-y-1.5">
              {names.map((n, i) => (
                <li key={i} className="text-sm text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  {n}
                </li>
              ))}
              {selected.exercises.length > 6 && (
                <li className="text-xs text-slate-500 pl-3.5">
                  +{selected.exercises.length - 6} más...
                </li>
              )}
            </ul>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Los pesos y reps se copian como referencia (marcados como pendientes).
            Edítalos el día del entreno para registrar tu progresión.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setSelected(null)}
              className="flex-1 bg-slate-700 py-2.5 rounded-xl text-sm"
            >
              ← Volver
            </button>
            <button
              onClick={() => onPick(selected)}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 text-slate-900 font-semibold py-2.5 rounded-xl text-sm"
            >
              <Copy size={15} /> Copiar rutina
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Lista de sesiones pasadas ──────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center px-4 pb-20"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-4 w-full max-w-md space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-base font-semibold">Copiar rutina anterior</h2>
          <p className="text-xs text-slate-400 mt-0.5">Elige una sesión pasada para usar como base</p>
        </div>

        <ul className="overflow-y-auto max-h-72 space-y-1.5">
          {sessions.map(s => {
            const preview = s.exercises
              .slice(0, 3)
              .map(e => exMap.get(e.exerciseId)?.name ?? '...')
              .join(' · ');
            const extra = s.exercises.length - 3;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setSelected(s)}
                  className="w-full text-left bg-slate-900 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs text-cyan-400 font-medium">{formatShortDate(s.date)}</span>
                    {s.name && (
                      <span className="text-xs text-slate-400 truncate max-w-[120px]">{s.name}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 truncate">
                    {preview}{extra > 0 ? ` +${extra}` : ''}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        <button onClick={onClose} className="w-full bg-slate-700 py-2.5 rounded-xl text-sm">
          Cancelar
        </button>
      </div>
    </div>
  );
}
