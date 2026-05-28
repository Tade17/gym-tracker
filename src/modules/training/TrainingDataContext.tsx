import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Exercise, Session, Template } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../lib/storage';
import { uid } from '../../lib/id';

// ─── Biblioteca base ──────────────────────────────────────────────────────────
// ~55 ejercicios cubriendo todos los grupos musculares.
// Se cargan solo la primera vez (localStorage vacío).
// El usuario puede agregar los suyos propios desde /ejercicios → "Nuevo".
// Si ya tienes ejercicios guardados, usa el botón "Restaurar base" en /ejercicios
// para fusionar estos sin perder los tuyos.
export const BASE_EXERCISES: Exercise[] = [
  // PECHO
  { id: uid(), name: 'Press banca con barra',          muscleGroup: 'pecho' },
  { id: uid(), name: 'Press banca con mancuernas',     muscleGroup: 'pecho' },
  { id: uid(), name: 'Press inclinado con barra',      muscleGroup: 'pecho' },
  { id: uid(), name: 'Press inclinado con mancuernas', muscleGroup: 'pecho' },
  { id: uid(), name: 'Press declinado',                muscleGroup: 'pecho' },
  { id: uid(), name: 'Aperturas con mancuernas',       muscleGroup: 'pecho' },
  { id: uid(), name: 'Crossover en polea',             muscleGroup: 'pecho' },
  { id: uid(), name: 'Fondos en paralelas (pecho)',    muscleGroup: 'pecho' },
  { id: uid(), name: 'Pullover con mancuerna',         muscleGroup: 'pecho' },

  // ESPALDA
  { id: uid(), name: 'Peso muerto convencional',       muscleGroup: 'espalda' },
  { id: uid(), name: 'Dominadas (agarre prono)',       muscleGroup: 'espalda' },
  { id: uid(), name: 'Jalón al pecho en polea',        muscleGroup: 'espalda' },
  { id: uid(), name: 'Remo con barra',                 muscleGroup: 'espalda' },
  { id: uid(), name: 'Remo con mancuerna',             muscleGroup: 'espalda' },
  { id: uid(), name: 'Remo en polea baja sentado',     muscleGroup: 'espalda' },
  { id: uid(), name: 'Remo Pendlay',                   muscleGroup: 'espalda' },
  { id: uid(), name: 'Face pull en polea',             muscleGroup: 'espalda' },
  { id: uid(), name: 'Pullover en polea',              muscleGroup: 'espalda' },
  { id: uid(), name: 'Encogimientos de hombros',       muscleGroup: 'espalda' },

  // HOMBROS
  { id: uid(), name: 'Press militar con barra',        muscleGroup: 'hombros' },
  { id: uid(), name: 'Press Arnold',                   muscleGroup: 'hombros' },
  { id: uid(), name: 'Elevaciones laterales',          muscleGroup: 'hombros' },
  { id: uid(), name: 'Elevaciones frontales',          muscleGroup: 'hombros' },
  { id: uid(), name: 'Pájaro (posterior)',             muscleGroup: 'hombros' },

  // CUÁDRICEPS
  { id: uid(), name: 'Sentadilla con barra',           muscleGroup: 'cuadriceps' },
  { id: uid(), name: 'Sentadilla búlgara',             muscleGroup: 'cuadriceps' },
  { id: uid(), name: 'Sentadilla goblet',              muscleGroup: 'cuadriceps' },
  { id: uid(), name: 'Prensa de piernas',              muscleGroup: 'cuadriceps' },
  { id: uid(), name: 'Extensión de cuádriceps',        muscleGroup: 'cuadriceps' },
  { id: uid(), name: 'Hack squat',                     muscleGroup: 'cuadriceps' },
  { id: uid(), name: 'Zancada con mancuernas',         muscleGroup: 'cuadriceps' },

  // ISQUIOTIBIALES
  { id: uid(), name: 'Peso muerto rumano',             muscleGroup: 'isquios' },
  { id: uid(), name: 'Curl femoral tumbado',           muscleGroup: 'isquios' },
  { id: uid(), name: 'Curl femoral sentado',           muscleGroup: 'isquios' },
  { id: uid(), name: 'Good morning',                   muscleGroup: 'isquios' },

  // GLÚTEOS
  { id: uid(), name: 'Hip thrust con barra',           muscleGroup: 'gluteos' },
  { id: uid(), name: 'Patada de glúteo en polea',      muscleGroup: 'gluteos' },
  { id: uid(), name: 'Abducción en máquina',           muscleGroup: 'gluteos' },

  // BÍCEPS
  { id: uid(), name: 'Curl bíceps con barra',          muscleGroup: 'biceps' },
  { id: uid(), name: 'Curl bíceps con mancuernas',     muscleGroup: 'biceps' },
  { id: uid(), name: 'Curl martillo',                  muscleGroup: 'biceps' },
  { id: uid(), name: 'Curl predicador (Scott)',        muscleGroup: 'biceps' },
  { id: uid(), name: 'Curl araña',                     muscleGroup: 'biceps' },
  { id: uid(), name: 'Curl en polea baja',             muscleGroup: 'biceps' },

  // TRÍCEPS
  { id: uid(), name: 'Extensión tríceps en polea alta',muscleGroup: 'triceps' },
  { id: uid(), name: 'Press francés (skull crusher)',  muscleGroup: 'triceps' },
  { id: uid(), name: 'Extensión tríceps sobre cabeza', muscleGroup: 'triceps' },
  { id: uid(), name: 'Pushdown con cuerda',            muscleGroup: 'triceps' },
  { id: uid(), name: 'Fondos de tríceps en banco',     muscleGroup: 'triceps' },

  // PANTORRILLAS
  { id: uid(), name: 'Elevación de talones de pie',    muscleGroup: 'pantorrillas' },
  { id: uid(), name: 'Elevación de talones sentado',   muscleGroup: 'pantorrillas' },

  // CORE
  { id: uid(), name: 'Crunch en polea',                muscleGroup: 'core' },
  { id: uid(), name: 'Plancha',                        muscleGroup: 'core' },
  { id: uid(), name: 'Rueda abdominal (ab wheel)',     muscleGroup: 'core' },
  { id: uid(), name: 'Elevación de piernas en barra',  muscleGroup: 'core' },
  { id: uid(), name: 'Russian twist',                  muscleGroup: 'core' },

  // ANTEBRAZO
  { id: uid(), name: 'Curl de muñeca',                 muscleGroup: 'antebrazo' },
  { id: uid(), name: 'Extensión de muñeca',            muscleGroup: 'antebrazo' },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface TrainingData {
  exercises: Exercise[];
  sessions: Session[];
  templates: Template[];
  setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
}

const Ctx = createContext<TrainingData | null>(null);

export function TrainingDataProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.exercises, BASE_EXERCISES);
  const [sessions,  setSessions]  = useLocalStorage<Session[]>(STORAGE_KEYS.sessions,  []);
  const [templates, setTemplates] = useLocalStorage<Template[]>(STORAGE_KEYS.templates, []);

  const value = useMemo<TrainingData>(
    () => ({ exercises, sessions, templates, setExercises, setSessions, setTemplates }),
    [exercises, sessions, templates, setExercises, setSessions, setTemplates],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrainingData(): TrainingData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTrainingData debe usarse dentro de <TrainingDataProvider>');
  return v;
}
