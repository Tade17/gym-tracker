// Wrapper sobre localStorage. Centraliza serialización JSON y manejo de errores
// (localStorage puede fallar en modo privado o si está lleno).

export const STORAGE_KEYS = {
  // Módulo 1 – Entrenamiento
  exercises:     'training:exercises',
  sessions:      'training:sessions',
  templates:     'training:templates',
  timerPresets:  'training:timerPresets',
  // Módulo 2 – Nutrición
  foods:         'nutrition:foods',
  dayLogs:       'nutrition:dayLogs',
  recipes:       'nutrition:recipes',
  // Módulo 3 – Seguimiento corporal
  weightEntries: 'body:weightEntries',
  photos:        'body:photos',
  // Global
  profile:       'user:profile',
} as const;

// Calcula cuánto espacio usa localStorage (aproximado en KB).
export function storageUsageKB(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? '';
    total += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  return Math.round(total * 2 / 1024); // UTF-16 → 2 bytes/char
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('localStorage save failed', err);
  }
}

// Exporta TODOS los datos del dominio en un solo JSON descargable.
export function exportAll(): string {
  const dump: Record<string, unknown> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const raw = localStorage.getItem(key);
    dump[key] = raw ? JSON.parse(raw) : null;
  }
  dump.__exportedAt = new Date().toISOString();
  return JSON.stringify(dump, null, 2);
}

export function importAll(json: string): void {
  const dump = JSON.parse(json) as Record<string, unknown>;
  for (const key of Object.values(STORAGE_KEYS)) {
    if (dump[key] !== null && dump[key] !== undefined) {
      localStorage.setItem(key, JSON.stringify(dump[key]));
    }
  }
}
