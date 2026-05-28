import type { Session, Template } from '../../../types';
import { addDays, toISODate } from '../../../lib/date';

export interface NextSessionHint {
  type: 'template' | 'last-week' | 'none';
  label: string;   // "Pull (última semana)", "Plantilla: Push", ...
  date?: string;   // fecha de la sesión de referencia
}

// Heurística "próxima sesión":
// 1. Si hay plantillas, sugiere la que no se ha usado esta semana.
// 2. Si no hay plantillas, busca qué entrenó el usuario este mismo día
//    de la semana pasada.
// 3. Si nada aplica, devuelve type='none'.
export function getNextSessionHint(
  sessions: Session[],
  templates: Template[],
  today: string = toISODate(),
): NextSessionHint {
  // --- Opción 1: plantillas no usadas esta semana ---
  if (templates.length > 0) {
    // Nombres de sesiones entrenadas en los últimos 7 días
    const recentNames = new Set(
      sessions
        .filter(s => s.date >= addDays(today, -6) && s.date <= today && s.name)
        .map(s => s.name!.trim().toLowerCase()),
    );
    // Buscar la primera plantilla cuyo nombre no aparezca esta semana
    const unused = templates.find(
      t => !recentNames.has(t.name.trim().toLowerCase()),
    );
    if (unused) {
      return { type: 'template', label: unused.name };
    }
  }

  // --- Opción 2: mismo día de la semana pasada ---
  const lastWeekSameDay = addDays(today, -7);
  const lastWeekSession = sessions.find(s => s.date === lastWeekSameDay);
  if (lastWeekSession) {
    return {
      type: 'last-week',
      label: lastWeekSession.name ?? 'Sin nombre',
      date: lastWeekSameDay,
    };
  }

  return { type: 'none', label: 'Sin datos' };
}
