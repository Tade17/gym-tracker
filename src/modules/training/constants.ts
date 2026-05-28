import type { SetType, MuscleGroup } from '../../types';

export interface SetTypeMeta {
  label: string;
  short: string;
  description: string;   // explicación para el usuario nuevo
  rirTarget: string;
  color: string;
  countsAsEffective: boolean;
  defaultRestSec: number;
}

export const SET_TYPE_META: Record<SetType, SetTypeMeta> = {
  warmup: {
    label: 'Aproximación',
    short: 'W',
    description: 'Series de calentamiento con poco peso. No cuentan en el volumen efectivo.',
    rirTarget: 'calentamiento',
    color: 'bg-slate-600 text-slate-200',
    countsAsEffective: false,
    defaultRestSec: 75,
  },
  topset: {
    label: 'Top Set',
    short: 'TS',
    description: 'Tu serie más pesada del ejercicio. El máximo que puedes mover con 0-1 reps en reserva (RIR 0-1). El BO y BO2 se calculan a partir de este peso.',
    rirTarget: 'RIR 0-1',
    color: 'bg-red-500 text-white',
    countsAsEffective: true,
    defaultRestSec: 210,
  },
  backoff: {
    label: 'Back-off',
    short: 'BO',
    description: 'Serie al 80% del Top Set. Más volumen con algo menos de intensidad (RIR 1-2). Se calcula automáticamente.',
    rirTarget: 'RIR 1-2',
    color: 'bg-orange-500 text-white',
    countsAsEffective: true,
    defaultRestSec: 165,
  },
  backoff2: {
    label: 'Back-off 2',
    short: 'BO2',
    description: 'Serie al 80% del BO (≈64% del TS). Acumula más volumen con más reps en reserva (RIR 2-3).',
    rirTarget: 'RIR 2-3',
    color: 'bg-amber-500 text-slate-900',
    countsAsEffective: true,
    defaultRestSec: 120,
  },
  normal: {
    label: 'Serie 3×',
    short: '3×',
    description: 'Para ejercicios de aislamiento: 3 series con el mismo peso y reps (ej. 3×12). Descanso corto entre series.',
    rirTarget: 'RIR 1-3',
    color: 'bg-cyan-500 text-slate-900',
    countsAsEffective: true,
    defaultRestSec: 90,
  },
  pump: {
    label: 'Pump',
    short: 'P',
    description: 'Serie finisher de alto volumen. Poco peso, muchas reps, sensación de congestión máxima. Descanso mínimo.',
    rirTarget: 'al fallo',
    color: 'bg-fuchsia-500 text-white',
    countsAsEffective: true,
    defaultRestSec: 60,
  },
};

export const SET_TYPES_ORDERED: SetType[] = [
  'warmup', 'topset', 'backoff', 'backoff2', 'normal', 'pump',
];

// Redondea al múltiplo de 2.5 más cercano (incremento estándar de discos).
// Ej: 84 → 82.5, 86 → 85, 80.1 → 80
export function roundTo2_5(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'pecho', 'espalda', 'hombros', 'cuadriceps', 'isquios', 'gluteos',
  'biceps', 'triceps', 'pantorrillas', 'core', 'antebrazo', 'otro',
];

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  pecho:       'Pecho',
  espalda:     'Espalda',
  hombros:     'Hombros',
  cuadriceps:  'Cuádriceps',
  isquios:     'Isquiotibiales',
  gluteos:     'Glúteos',
  biceps:      'Bíceps',
  triceps:     'Tríceps',
  pantorrillas:'Pantorrillas',
  core:        'Core / Abdominales',
  antebrazo:   'Antebrazo',
  otro:        'Otro',
};

export const TIMER_PRESETS: { label: string; seconds: number }[] = [
  { label: 'Ramp-up',      seconds: 75  },
  { label: 'Post TS',      seconds: 210 },
  { label: 'Post BO',      seconds: 165 },
  { label: 'Post BO2',     seconds: 120 },
  { label: 'Aislamiento',  seconds: 90  },
];

export const CARDIO_TYPES = [
  'Cinta de correr',
  'Bicicleta estática',
  'Elíptica',
  'Remo (máquina)',
  'Stepper',
  'Saltar a la comba',
  'Natación',
  'Correr al aire libre',
  'Bici al aire libre',
  'HIIT',
  'Otro',
] as const;
