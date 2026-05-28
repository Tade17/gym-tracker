import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp, TrendingDown, Minus, Calendar, ChevronRight } from 'lucide-react';
import { useTrainingData } from '../TrainingDataContext';
import { formatShortDate, toISODate, addDays } from '../../../lib/date';
import { MUSCLE_LABEL, SET_TYPE_META } from '../constants';
import { effectiveSetsThisWeek } from '../utils/volume';
import type { MuscleGroup } from '../../../types';

export default function History() {
  const { sessions, exercises } = useTrainingData();
  const [refDate] = useState(toISODate());

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions],
  );

  const thisWeek = useMemo(
    () => effectiveSetsThisWeek(sessions, exercises, refDate),
    [sessions, exercises, refDate],
  );
  const lastWeek = useMemo(
    () => effectiveSetsThisWeek(sessions, exercises, addDays(refDate, -7)),
    [sessions, exercises, refDate],
  );

  const groups = useMemo(() => {
    const all = new Set<MuscleGroup>();
    (Object.keys(thisWeek) as MuscleGroup[]).forEach(g => all.add(g));
    (Object.keys(lastWeek) as MuscleGroup[]).forEach(g => all.add(g));
    return Array.from(all).sort((a, b) => (thisWeek[b] ?? 0) - (thisWeek[a] ?? 0));
  }, [thisWeek, lastWeek]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart2 size={22} className="text-cyan-400" />
        <h1 className="text-2xl font-bold">Historial</h1>
      </div>

      {/* Volumen semanal */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 space-y-3">
        <div>
          <h2 className="font-semibold">Volumen semanal</h2>
          <p className="text-xs text-slate-400">Series efectivas · esta semana vs anterior</p>
        </div>

        {groups.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin datos esta semana.</p>
        ) : (
          <ul className="space-y-2">
            {groups.map(g => {
              const cur = thisWeek[g] ?? 0;
              const prev = lastWeek[g] ?? 0;
              const delta = cur - prev;
              const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
              const deltaColor = delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-slate-500';

              return (
                <li key={g} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{MUSCLE_LABEL[g]}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{cur}</span>
                    <span className="text-slate-600 text-xs">vs {prev}</span>
                    <DeltaIcon size={14} className={deltaColor} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Sesiones pasadas */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          <h2 className="font-semibold">Sesiones</h2>
        </div>

        {sorted.length === 0 ? (
          <p className="text-slate-500 text-sm">Aún no hay sesiones registradas.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map(s => {
              const effectiveSets = s.exercises.reduce(
                (acc, e) => acc + e.sets.filter(
                  set => set.done && SET_TYPE_META[set.type].countsAsEffective
                ).length,
                0,
              );
              return (
                <li key={s.id}>
                  <Link
                    to={`/sesion/${s.date}`}
                    className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700/40 rounded-xl px-3 py-3 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{s.name || 'Sin nombre'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {s.exercises.length} ejercicios · {effectiveSets} series efectivas
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-xs">{formatShortDate(s.date)}</span>
                      <ChevronRight size={15} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
