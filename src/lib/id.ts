// Generador de IDs únicos. crypto.randomUUID() es nativo en navegadores modernos
// y no necesita instalar una librería como "uuid". Cae a un fallback por si acaso.
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
