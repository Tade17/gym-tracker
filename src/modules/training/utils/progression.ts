import type { Session, ExerciseEntry, SetEntry } from '../../../types';
import { SET_TYPE_META } from '../constants';
import { startOfWeek, addDays } from '../../../lib/date';

// "Top efectivo" = el mejor set efectivo (peso * reps), excluyendo warmups.
// Sirve para comparar progreso semana a semana sin meter ruido de calentamientos.
export interface TopEffective {
  weight: number;
  reps: number;
  volume: number; // peso * reps
}

export function topEffectiveSet(entry: ExerciseEntry): TopEffective | null {
  let best: TopEffective | null = null;
  for (const s of entry.sets) {
    if (!SET_TYPE_META[s.type].countsAsEffective) continue;
    if (!s.done) continue;
    if (s.weight <= 0 || s.reps <= 0) continue;
    const vol = s.weight * s.reps;
    if (!best || vol > best.volume) {
      best = { weight: s.weight, reps: s.reps, volume: vol };
    }
  }
  return best;
}

// Dada una fecha y un ejercicio, devuelve el mismo ejercicio de la semana anterior
// (si existe en alguna sesión de esa semana).
export function findPreviousWeekEntry(
  sessions: Session[],
  currentDate: string,
  exerciseId: string,
): { session: Session; entry: ExerciseEntry } | null {
  const thisWeekMonday = startOfWeek(currentDate);
  const prevWeekMonday = addDays(thisWeekMonday, -7);
  const prevWeekSunday = addDays(thisWeekMonday, -1);

  // Buscar la sesión más reciente dentro de la semana anterior que contenga este ejercicio.
  let bestMatch: { session: Session; entry: ExerciseEntry } | null = null;
  for (const s of sessions) {
    if (s.date < prevWeekMonday || s.date > prevWeekSunday) continue;
    const entry = s.exercises.find(e => e.exerciseId === exerciseId);
    if (!entry) continue;
    if (!bestMatch || s.date > bestMatch.session.date) {
      bestMatch = { session: s, entry };
    }
  }
  return bestMatch;
}

// Compara la semana actual con la anterior. Devuelve si hay progresión (más peso a iguales reps,
// o más reps al mismo peso, o ambos).
export type ProgressionStatus = 'progress' | 'equal' | 'regress' | 'noData';

export function compareWithPrevious(
  current: TopEffective | null,
  previous: TopEffective | null,
): ProgressionStatus {
  if (!current) return 'noData';
  if (!previous) return 'noData';
  if (current.weight > previous.weight) return 'progress';
  if (current.weight === previous.weight) {
    if (current.reps > previous.reps) return 'progress';
    if (current.reps === previous.reps) return 'equal';
    return 'regress';
  }
  return 'regress';
}

// Compara dos sets individuales (útil dentro del editor cuando estás llenando una serie).
export function setBeatsPrevious(current: SetEntry, previous: TopEffective | null): boolean {
  if (!previous) return false;
  if (current.weight > previous.weight && current.reps >= previous.reps) return true;
  if (current.weight === previous.weight && current.reps > previous.reps) return true;
  return false;
}
