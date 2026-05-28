import type { Session, Exercise } from '../../../types';
import { SET_TYPE_META } from '../constants';
import { formatShortDate } from '../../../lib/date';

// Formatea una sesión como texto plano legible para WhatsApp / Telegram / etc.
function formatOneSession(session: Session, exMap: Map<string, Exercise>): string {
  const title = session.name
    ? `💪 ${session.name} — ${formatShortDate(session.date)}`
    : `💪 ${formatShortDate(session.date)}`;

  const exerciseBlocks = session.exercises.map(entry => {
    const name = exMap.get(entry.exerciseId)?.name ?? '(ejercicio eliminado)';
    const setLines = entry.sets.map(s => {
      const label = SET_TYPE_META[s.type].short.padEnd(4);
      const weight = s.weight ? `${s.weight} kg` : '—';
      const reps   = s.reps   ? `${s.reps} reps` : '—';
      const check  = s.done   ? ' ✓' : '';
      return `  ${label} ${weight} × ${reps}${check}`;
    });
    return [name, ...setLines].join('\n');
  });

  const cardioLines = (session.cardio ?? []).map(c => {
    const parts: string[] = [c.type];
    if (c.durationMin) parts.push(`${c.durationMin} min`);
    if (c.notes)       parts.push(c.notes);
    return `🏃 ${parts.join(' · ')}`;
  });

  const blocks: string[] = [title];
  if (exerciseBlocks.length) blocks.push('', ...exerciseBlocks);
  if (cardioLines.length)    blocks.push('', ...cardioLines);

  return blocks.join('\n');
}

// Formatea una o varias sesiones. Si es más de una, las separa con un divisor.
export function formatSessionsText(sessions: Session[], exMap: Map<string, Exercise>): string {
  if (sessions.length === 0) return '';
  if (sessions.length === 1) return formatOneSession(sessions[0], exMap);

  return sessions
    .map(s => `━━━ ${formatShortDate(s.date)} ━━━\n${formatOneSession(s, exMap)}`)
    .join('\n\n');
}
