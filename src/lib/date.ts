// Utilidades de fecha. Trabajamos con strings "YYYY-MM-DD" porque:
// 1) Se ordenan alfabéticamente como cronológicamente.
// 2) No tienen problemas de zonas horarias.
// 3) Se serializan a JSON sin sorpresas.

export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Lunes como inicio de semana (estándar europeo / fitness).
// Devuelve un YYYY-MM-DD del lunes de esa semana.
export function startOfWeek(iso: string): string {
  const d = fromISODate(iso);
  const day = d.getDay(); // 0=dom, 1=lun, ..., 6=sab
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// "Lun 27 may" para mostrar en UI
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatShortDate(iso: string): string {
  const d = fromISODate(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
