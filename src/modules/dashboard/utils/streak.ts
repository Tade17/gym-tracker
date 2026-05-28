import type { Session } from '../../../types';
import { addDays, toISODate } from '../../../lib/date';

// Cuenta los días consecutivos hacia atrás desde la referencia en que
// existe al menos una sesión con ejercicios. Si hoy aún no se ha entrenado,
// la racha no se rompe — empieza a contar desde ayer.
export function calcStreak(sessions: Session[], today: string = toISODate()): number {
  const trainedSet = new Set(
    sessions
      .filter(s => s.exercises.length > 0)
      .map(s => s.date),
  );

  // Si hoy ya hay sesión contamos desde hoy; si no, desde ayer.
  const start = trainedSet.has(today) ? today : addDays(today, -1);

  let streak = 0;
  let cursor = start;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!trainedSet.has(cursor)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

// Devuelve el array de los últimos N días (hoy incluido) indicando si se entrenó.
// Útil para el "dot streak" visual de los últimos 7 días.
export function lastNDays(sessions: Session[], n: number, today: string = toISODate()) {
  const trainedSet = new Set(
    sessions.filter(s => s.exercises.length > 0).map(s => s.date),
  );
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, -(n - 1 - i));
    return { date, trained: trainedSet.has(date) };
  });
}
