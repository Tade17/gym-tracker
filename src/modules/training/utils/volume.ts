import type { Session, Exercise, MuscleGroup } from '../../../types';
import { SET_TYPE_META } from '../constants';
import { startOfWeek, addDays } from '../../../lib/date';

// Cuenta series efectivas por grupo muscular dentro de un rango de fechas (inclusive).
// "Efectiva" = serie marcada como done, con peso > 0 y reps > 0, y de un SetType que cuenta.
export function effectiveSetsByMuscle(
  sessions: Session[],
  exercises: Exercise[],
  fromIso: string,
  toIso: string,
): Record<MuscleGroup, number> {
  const counts: Partial<Record<MuscleGroup, number>> = {};
  const exMap = new Map(exercises.map(e => [e.id, e]));

  for (const s of sessions) {
    if (s.date < fromIso || s.date > toIso) continue;
    for (const entry of s.exercises) {
      const ex = exMap.get(entry.exerciseId);
      if (!ex) continue;
      for (const set of entry.sets) {
        if (!set.done) continue;
        if (set.weight <= 0 || set.reps <= 0) continue;
        if (!SET_TYPE_META[set.type].countsAsEffective) continue;
        counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1;
      }
    }
  }
  return counts as Record<MuscleGroup, number>;
}

export function effectiveSetsThisWeek(
  sessions: Session[],
  exercises: Exercise[],
  refDate: string,
): Record<MuscleGroup, number> {
  const monday = startOfWeek(refDate);
  const sunday = addDays(monday, 6);
  return effectiveSetsByMuscle(sessions, exercises, monday, sunday);
}
